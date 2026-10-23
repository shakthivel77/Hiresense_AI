import { Router, Response } from 'express';
import { requireAuth, requireRole, requireCollegeAccess } from '../auth/middleware.js';
import { AuthenticatedRequest } from '../auth/types.js';
import { collegeService } from './service.js';

export const collegesRouter = Router();
export const adminRouter = Router();

// ============================================================================
// Public / Student College Endpoints
// ============================================================================

/**
 * GET /api/colleges/approved
 * Public endpoint to list all approved colleges for searchable dropdown
 */
collegesRouter.get('/approved', async (_req, res: Response) => {
  try {
    const list = await collegeService.listApprovedColleges();
    res.status(200).json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * POST /api/colleges/affiliations/request
 * Authenticated student requests college affiliation
 */
collegesRouter.post('/affiliations/request', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { collegeId, requestedCollegeName, officialCollegeEmail } = req.body;

    if (!collegeId && !requestedCollegeName) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Either a college selection or requested college name is required.' },
      });
      return;
    }

    const request = await collegeService.requestAffiliation(
      studentId,
      { collegeId, requestedCollegeName, officialCollegeEmail },
      req.user!.email
    );

    res.status(201).json({ success: true, data: request });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'REQUEST_FAILED', message: err.message } });
  }
});

/**
 * GET /api/colleges/affiliations/my-status
 * Authenticated student inspects their college affiliation status
 */
collegesRouter.get('/affiliations/my-status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requests = await collegeService.getAffiliationRequests(undefined, req.user?.collegeId || undefined);
    const myRequest = requests.find((r) => r.studentId === req.user!.id);
    let college = null;
    if (req.user?.collegeId) {
      college = await collegeService.getCollegeById(req.user.collegeId);
    }

    res.status(200).json({
      success: true,
      data: {
        affiliationStatus: req.user?.affiliationStatus || 'UNCLAIMED',
        collegeId: req.user?.collegeId || null,
        college,
        activeRequest: myRequest || null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ============================================================================
// Monitoring Admin Endpoints (Scoped by College Access)
// ============================================================================

/**
 * GET /api/colleges/monitoring/assigned
 * Returns list of colleges actively assigned to the authenticated monitoring admin
 */
collegesRouter.get(
  '/monitoring/assigned',
  requireAuth,
  requireRole(['MONITORING_ADMIN', 'MAIN_ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user!.role === 'MAIN_ADMIN') {
        const allColleges = await collegeService.listApprovedColleges();
        res.status(200).json({ success: true, data: allColleges });
        return;
      }

      const assignedIds = await collegeService.getAdminAssignedCollegeIds(req.user!.id);
      const colleges = [];
      for (const id of assignedIds) {
        const col = await collegeService.getCollegeById(id);
        if (col && col.status === 'APPROVED') {
          colleges.push(col);
        }
      }

      res.status(200).json({ success: true, data: colleges });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }
);

/**
 * GET /api/colleges/monitoring/:collegeId/analytics
 * Real database-backed metrics, skill gaps, and verification statistics
 */
collegesRouter.get(
  '/monitoring/:collegeId/analytics',
  requireAuth,
  requireRole(['MONITORING_ADMIN', 'MAIN_ADMIN']),
  requireCollegeAccess(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const analytics = await collegeService.getCollegeAnalytics(req.params.collegeId, req.user!.id);
      res.status(200).json({ success: true, data: analytics });
    } catch (err: any) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: err.message } });
    }
  }
);

/**
 * GET /api/colleges/monitoring/:collegeId/students
 * Paginated/searchable list of verified students belonging to assigned college
 */
collegesRouter.get(
  '/monitoring/:collegeId/students',
  requireAuth,
  requireRole(['MONITORING_ADMIN', 'MAIN_ADMIN']),
  requireCollegeAccess(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const query = req.query.query as string;
      const students = await collegeService.getCollegeStudents(req.params.collegeId, req.user!.id, query);
      res.status(200).json({ success: true, data: students });
    } catch (err: any) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: err.message } });
    }
  }
);

/**
 * GET /api/colleges/monitoring/:collegeId/export-csv
 * Export verified college student metrics as CSV
 */
collegesRouter.get(
  '/monitoring/:collegeId/export-csv',
  requireAuth,
  requireRole(['MONITORING_ADMIN', 'MAIN_ADMIN']),
  requireCollegeAccess(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const csv = await collegeService.exportCollegeReportCsv(req.params.collegeId, req.user!.id);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="college-report-${req.params.collegeId}.csv"`);
      res.status(200).send(csv);
    } catch (err: any) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: err.message } });
    }
  }
);

// ============================================================================
// Main Admin Control Plane Endpoints
// ============================================================================

/**
 * GET /api/admin/overview
 * Platform-wide overview metrics across all colleges
 */
adminRouter.get('/overview', requireAuth, requireRole('MAIN_ADMIN'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await collegeService.getPlatformOverviewStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * GET /api/admin/colleges
 * Searchable list of all colleges and statuses
 */
adminRouter.get('/colleges', requireAuth, requireRole('MAIN_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const search = req.query.search as string;
    const status = req.query.status as string;
    const colleges = await collegeService.getAllColleges(search, status);
    res.status(200).json({ success: true, data: colleges });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * POST /api/admin/colleges
 * Create a new college
 */
adminRouter.post('/colleges', requireAuth, requireRole('MAIN_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, code, domain } = req.body;
    if (!name || !code) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'College name and code are required.' },
      });
      return;
    }

    const college = await collegeService.createCollege({ name, code, domain }, req.user!.id);
    res.status(201).json({ success: true, data: college });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'CREATION_FAILED', message: err.message } });
  }
});

/**
 * PATCH /api/admin/colleges/:id
 * Update college metadata or approval status
 */
adminRouter.patch('/colleges/:id', requireAuth, requireRole('MAIN_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await collegeService.updateCollege(req.params.id, req.body, req.user!.id);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'UPDATE_FAILED', message: err.message } });
  }
});

/**
 * GET /api/admin/affiliations
 * List student affiliation requests
 */
adminRouter.get('/affiliations', requireAuth, requireRole('MAIN_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status as string;
    const collegeId = req.query.collegeId as string;
    const requests = await collegeService.getAffiliationRequests(status, collegeId);
    res.status(200).json({ success: true, data: requests });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * PATCH /api/admin/affiliations/:id
 * Approve or reject student affiliation
 */
adminRouter.patch('/affiliations/:id', requireAuth, requireRole('MAIN_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, reviewNotes } = req.body;
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: "Status must be 'APPROVED' or 'REJECTED'." },
      });
      return;
    }

    const reviewed = await collegeService.reviewAffiliationRequest(
      req.params.id,
      status,
      req.user!.id,
      reviewNotes
    );
    res.status(200).json({ success: true, data: reviewed });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'REVIEW_FAILED', message: err.message } });
  }
});

/**
 * GET /api/admin/monitoring-admins
 * List all Monitoring Admins with college assignments
 */
adminRouter.get('/monitoring-admins', requireAuth, requireRole('MAIN_ADMIN'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const admins = await collegeService.listMonitoringAdmins();
    res.status(200).json({ success: true, data: admins });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * POST /api/admin/monitoring-admins/invite
 * Provision / invite Monitoring Admin with designated colleges
 */
adminRouter.post('/monitoring-admins/invite', requireAuth, requireRole('MAIN_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, displayName, collegeIds } = req.body;
    if (!email || !collegeIds || !Array.isArray(collegeIds) || collegeIds.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Valid email and at least one assigned college ID are required.' },
      });
      return;
    }

    const created = await collegeService.inviteMonitoringAdmin(
      email,
      displayName || email.split('@')[0],
      collegeIds,
      req.user!.id
    );

    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'INVITE_FAILED', message: err.message } });
  }
});

/**
 * PATCH /api/admin/monitoring-admins/:adminId/status
 * Suspend or reactivate Monitoring Admin
 */
adminRouter.patch('/monitoring-admins/:adminId/status', requireAuth, requireRole('MAIN_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Field isActive must be boolean.' },
      });
      return;
    }

    await collegeService.setAdminActiveStatus(req.params.adminId, isActive, req.user!.id);
    res.status(200).json({ success: true, data: { adminId: req.params.adminId, isActive } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'STATUS_UPDATE_FAILED', message: err.message } });
  }
});

/**
 * POST /api/admin/monitoring-admins/:adminId/assign
 * Assign additional college to monitoring admin
 */
adminRouter.post('/monitoring-admins/:adminId/assign', requireAuth, requireRole('MAIN_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { collegeId } = req.body;
    if (!collegeId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'collegeId is required.' },
      });
      return;
    }

    const assignment = await collegeService.assignCollegeToAdmin(req.params.adminId, collegeId, req.user!.id);
    res.status(200).json({ success: true, data: assignment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'ASSIGNMENT_FAILED', message: err.message } });
  }
});

/**
 * POST /api/admin/monitoring-admins/:adminId/revoke
 * Revoke college assignment from monitoring admin
 */
adminRouter.post('/monitoring-admins/:adminId/revoke', requireAuth, requireRole('MAIN_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { collegeId } = req.body;
    if (!collegeId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'collegeId is required.' },
      });
      return;
    }

    await collegeService.revokeCollegeFromAdmin(req.params.adminId, collegeId, req.user!.id);
    res.status(200).json({ success: true, data: { revoked: true, collegeId } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'REVOCATION_FAILED', message: err.message } });
  }
});

/**
 * GET /api/admin/audit-logs
 * Review administrative activity logs
 */
adminRouter.get('/audit-logs', requireAuth, requireRole('MAIN_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const logs = collegeService.getAuditLogs(limit);
    res.status(200).json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

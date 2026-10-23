import express from 'express';
import http from 'http';
import { collegesRouter, adminRouter } from './routes.js';
import { coursesRouter } from '../courses/routes.js';
import { userService } from '../users/service.js';
import { collegeService } from './service.js';

export async function runCollegeAdminSecuritySuite() {
  console.log('=== STARTING ROLE-BASED MULTI-COLLEGE PLATFORM SECURITY REGRESSION SUITE ===\n');

  const app = express();
  app.use(express.json());
  app.use('/api/colleges', collegesRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/courses', coursesRouter);

  const TEST_PORT = 5301;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`Test Express server listening on http://localhost:${TEST_PORT}`);
      resolve();
    });
  });

  const baseUrl = `http://localhost:${TEST_PORT}`;
  const STANFORD_ID = '11111111-1111-1111-1111-111111111111';
  const MIT_ID = '22222222-2222-2222-2222-222222222222';
  const STUDENT_ID = '00000000-0000-0000-0000-000000000001';
  const MAIN_ADMIN_ID = '00000000-0000-0000-0000-000000000002';
  const MONITORING_ADMIN_STANFORD_ID = 'admin-stanford-01';
  const MONITORING_ADMIN_MIT_ID = 'admin-mit-02';

  // Seed test accounts in service
  await userService.setRoleAndAffiliation(STUDENT_ID, 'STUDENT', null, 'UNCLAIMED');
  await userService.setRoleAndAffiliation(MAIN_ADMIN_ID, 'MAIN_ADMIN');
  await userService.setRoleAndAffiliation(MONITORING_ADMIN_STANFORD_ID, 'MONITORING_ADMIN');
  await collegeService.assignCollegeToAdmin(MONITORING_ADMIN_STANFORD_ID, STANFORD_ID, MAIN_ADMIN_ID);
  await userService.setRoleAndAffiliation(MONITORING_ADMIN_MIT_ID, 'MONITORING_ADMIN');
  await collegeService.assignCollegeToAdmin(MONITORING_ADMIN_MIT_ID, MIT_ID, MAIN_ADMIN_ID);

  try {
    // ------------------------------------------------------------------------
    // SCENARIO 1: Unauthenticated request to admin route is strictly rejected (401)
    // ------------------------------------------------------------------------
    console.log('--- TEST 1: Unauthenticated admin requests return 401 ---');
    const resNoAuth = await fetch(`${baseUrl}/api/admin/overview`);
    if (resNoAuth.status !== 401) {
      throw new Error(`Expected 401, got ${resNoAuth.status}`);
    }
    const errBody = await resNoAuth.json();
    if (errBody.error?.code !== 'UNAUTHORIZED') {
      throw new Error(`Expected error code UNAUTHORIZED, got ${errBody.error?.code}`);
    }
    console.log('PASS: Unauthenticated admin request strictly rejected with 401.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 2: Student accessing admin routes receives 403 Forbidden
    // ------------------------------------------------------------------------
    console.log('--- TEST 2: Student role accessing Main Admin route receives 403 Forbidden ---');
    const resStudentOnAdmin = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: 'Bearer mock-student-token' },
    });
    if (resStudentOnAdmin.status !== 403) {
      throw new Error(`Expected 403, got ${resStudentOnAdmin.status}`);
    }
    console.log('PASS: Student role accessing Main Admin route rejected with 403.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 3: Monitoring Admin attempting Main Admin operations receives 403
    // ------------------------------------------------------------------------
    console.log('--- TEST 3: Monitoring Admin cannot perform Main Admin operations ---');
    const resMonAdminOnMain = await fetch(`${baseUrl}/api/admin/colleges`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer mock-monitoring-admin-${MONITORING_ADMIN_STANFORD_ID}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Hacker College', code: 'HACK' }),
    });
    if (resMonAdminOnMain.status !== 403) {
      throw new Error(`Expected 403, got ${resMonAdminOnMain.status}`);
    }
    console.log('PASS: Monitoring Admin restricted from Main Admin operations with 403.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 4: Main Admin can view platform overview and manage colleges
    // ------------------------------------------------------------------------
    console.log('--- TEST 4: Main Admin can view platform overview ---');
    const resOverview = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: 'Bearer mock-main-admin-token' },
    });
    if (resOverview.status !== 200) {
      throw new Error(`Expected 200, got ${resOverview.status}`);
    }
    const overviewData = await resOverview.json();
    if (!overviewData.data.totalApprovedColleges || overviewData.data.totalApprovedColleges < 6) {
      throw new Error('Platform overview stats missing approved colleges.');
    }
    console.log(`PASS: Platform overview returned ${overviewData.data.totalApprovedColleges} approved colleges.\n`);

    // ------------------------------------------------------------------------
    // SCENARIO 5: Monitoring Admin A can access their assigned Stanford college analytics
    // ------------------------------------------------------------------------
    console.log('--- TEST 5: Monitoring Admin A accesses assigned college analytics ---');
    const resStanford = await fetch(`${baseUrl}/api/colleges/monitoring/${STANFORD_ID}/analytics`, {
      headers: { Authorization: `Bearer mock-monitoring-admin-${MONITORING_ADMIN_STANFORD_ID}` },
    });
    if (resStanford.status !== 200) {
      throw new Error(`Expected 200, got ${resStanford.status}`);
    }
    const stanfordData = await resStanford.json();
    if (stanfordData.data.college.code !== 'STANFORD') {
      throw new Error(`Expected Stanford data, got ${stanfordData.data.college.code}`);
    }
    console.log('PASS: Monitoring Admin A successfully accessed assigned Stanford analytics.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 6: Monitoring Admin A attempting to access MIT is strictly blocked with 403
    // ------------------------------------------------------------------------
    console.log('--- TEST 6: Monitoring Admin A accessing unassigned MIT receives 403 ---');
    const resBlockedMit = await fetch(`${baseUrl}/api/colleges/monitoring/${MIT_ID}/analytics`, {
      headers: { Authorization: `Bearer mock-monitoring-admin-${MONITORING_ADMIN_STANFORD_ID}` },
    });
    if (resBlockedMit.status !== 403) {
      throw new Error(`Expected 403, got ${resBlockedMit.status}`);
    }
    console.log('PASS: Cross-college access strictly rejected with 403.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 7: College CSV Export enforces boundary isolation
    // ------------------------------------------------------------------------
    console.log('--- TEST 7: College CSV export boundary isolation ---');
    const resBlockedExport = await fetch(`${baseUrl}/api/colleges/monitoring/${MIT_ID}/export-csv`, {
      headers: { Authorization: `Bearer mock-monitoring-admin-${MONITORING_ADMIN_STANFORD_ID}` },
    });
    if (resBlockedExport.status !== 403) {
      throw new Error(`Expected 403 on unassigned CSV export, got ${resBlockedExport.status}`);
    }

    const resAllowedExport = await fetch(`${baseUrl}/api/colleges/monitoring/${STANFORD_ID}/export-csv`, {
      headers: { Authorization: `Bearer mock-monitoring-admin-${MONITORING_ADMIN_STANFORD_ID}` },
    });
    if (resAllowedExport.status !== 200) {
      throw new Error(`Expected 200 on assigned CSV export, got ${resAllowedExport.status}`);
    }
    const csvText = await resAllowedExport.text();
    if (!csvText.includes('Student ID,Display Name,Email')) {
      throw new Error('CSV output does not contain expected header row.');
    }
    console.log('PASS: CSV export boundary enforced; authorized college exported successfully.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 8: Student can request college affiliation -> PENDING_VERIFICATION
    // ------------------------------------------------------------------------
    console.log('--- TEST 8: Student college affiliation request workflow ---');
    const resAffRequest = await fetch(`${baseUrl}/api/colleges/affiliations/request`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer mock-student-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collegeId: STANFORD_ID,
        officialCollegeEmail: 'learner@stanford.edu',
      }),
    });
    if (resAffRequest.status !== 201) {
      throw new Error(`Expected 201, got ${resAffRequest.status}`);
    }

    const resAffStatus = await fetch(`${baseUrl}/api/colleges/affiliations/my-status`, {
      headers: { Authorization: 'Bearer mock-student-token' },
    });
    const statusData = await resAffStatus.json();
    if (statusData.data.affiliationStatus !== 'PENDING_VERIFICATION') {
      throw new Error(`Expected PENDING_VERIFICATION, got ${statusData.data.affiliationStatus}`);
    }
    console.log('PASS: Student affiliation request created and marked PENDING_VERIFICATION.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 9: Main Admin reviews and approves affiliation -> VERIFIED
    // ------------------------------------------------------------------------
    console.log('--- TEST 9: Main Admin reviews and approves affiliation ---');
    const resAffList = await fetch(`${baseUrl}/api/admin/affiliations?status=PENDING`, {
      headers: { Authorization: 'Bearer mock-main-admin-token' },
    });
    const affListData = await resAffList.json();
    const studentReq = affListData.data.find((r: any) => r.studentId === STUDENT_ID);
    if (!studentReq) {
      throw new Error('Pending affiliation request for student not found.');
    }

    const resApprove = await fetch(`${baseUrl}/api/admin/affiliations/${studentReq.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer mock-main-admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'APPROVED',
        reviewNotes: 'Official university email verified.',
      }),
    });
    if (resApprove.status !== 200) {
      throw new Error(`Expected 200, got ${resApprove.status}`);
    }

    const updatedProfile = await userService.getProfileByUserId(STUDENT_ID);
    if (updatedProfile?.affiliationStatus !== 'VERIFIED') {
      throw new Error(`Expected VERIFIED profile status, got ${updatedProfile?.affiliationStatus}`);
    }
    console.log('PASS: Main Admin approved student affiliation; profile status updated to VERIFIED.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 10: Course Authoring & Public Consumption
    // ------------------------------------------------------------------------
    console.log('--- TEST 10: Course authoring and publishing ---');
    // Student blocked from creating course
    const resStudentCourse = await fetch(`${baseUrl}/api/courses`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer mock-student-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Unauthorized Student Course',
        description: 'Should fail',
        domainSlug: 'backend-developer',
      }),
    });
    if (resStudentCourse.status !== 403) {
      throw new Error(`Expected 403 on student course creation, got ${resStudentCourse.status}`);
    }

    // Main Admin creates course
    const resAdminCourse = await fetch(`${baseUrl}/api/courses`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer mock-main-admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Distributed Systems & Consistency Models',
        description: 'CAP theorem, Raft consensus, and event-driven architectures.',
        domainSlug: 'backend-developer',
        status: 'PUBLISHED',
      }),
    });
    if (resAdminCourse.status !== 201) {
      throw new Error(`Expected 201, got ${resAdminCourse.status}`);
    }

    const resPublicCourses = await fetch(`${baseUrl}/api/courses?domain=backend-developer`);
    const publicCoursesData = await resPublicCourses.json();
    if (!publicCoursesData.data.some((c: any) => c.title === 'Distributed Systems & Consistency Models')) {
      throw new Error('Published course not visible in public course catalog.');
    }
    console.log('PASS: Main Admin authored course; publicly visible to learners.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 11: Question Bank Authoring & Validations
    // ------------------------------------------------------------------------
    console.log('--- TEST 11: Question Bank validations ---');
    const resInvalidQuestion = await fetch(`${baseUrl}/api/courses/questions/bank`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer mock-main-admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        skillId: 'nodejs',
        questionText: 'Invalid options count',
        options: ['Only one option'],
        correctOptionIndex: 0,
      }),
    });
    if (resInvalidQuestion.status !== 400) {
      throw new Error(`Expected 400 on invalid question, got ${resInvalidQuestion.status}`);
    }

    const resValidQuestion = await fetch(`${baseUrl}/api/courses/questions/bank`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer mock-main-admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        skillId: 'nodejs',
        questionText: 'What is libuv?',
        options: ['Asynchronous I/O library in C', 'CSS preprocessor', 'Browser debugger'],
        correctOptionIndex: 0,
        difficulty: 'intermediate',
      }),
    });
    if (resValidQuestion.status !== 201) {
      throw new Error(`Expected 201, got ${resValidQuestion.status}`);
    }
    console.log('PASS: Question bank validation enforced; valid question registered.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 12: Suspended Admin Invariant
    // ------------------------------------------------------------------------
    console.log('--- TEST 12: Suspended admin immediately loses access ---');
    const resSuspend = await fetch(`${baseUrl}/api/admin/monitoring-admins/${MONITORING_ADMIN_STANFORD_ID}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer mock-main-admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive: false }),
    });
    if (resSuspend.status !== 200) {
      throw new Error(`Expected 200 on suspend, got ${resSuspend.status}`);
    }

    const resSuspendedAccess = await fetch(`${baseUrl}/api/colleges/monitoring/${STANFORD_ID}/analytics`, {
      headers: { Authorization: `Bearer mock-monitoring-admin-${MONITORING_ADMIN_STANFORD_ID}` },
    });
    if (resSuspendedAccess.status !== 403) {
      throw new Error(`Expected 403 for suspended admin, got ${resSuspendedAccess.status}`);
    }
    const suspErr = await resSuspendedAccess.json();
    if (!suspErr.error?.message.includes('suspended')) {
      throw new Error(`Expected suspended error message, got: ${suspErr.error?.message}`);
    }
    console.log('PASS: Suspended administrator was immediately barred from college endpoints with 403.\n');

    console.log('================================================================');
    console.log('🎉 ALL 12 MULTI-COLLEGE ROLE SECURITY TESTS PASSED!');
    console.log('================================================================\n');
  } finally {
    server.close();
  }
}

// Auto-run if executed directly via tsx
runCollegeAdminSecuritySuite().catch((err) => {
  console.error('TEST RUNNER FAILED:', err);
  process.exit(1);
});

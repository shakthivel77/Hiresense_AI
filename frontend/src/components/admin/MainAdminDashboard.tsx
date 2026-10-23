import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Users,
  ShieldCheck,
  BookOpen,
  Plus,
  Search,
  XCircle,
  History,
  FileCheck,
  UserPlus,
  RefreshCw,
} from 'lucide-react';

interface PlatformOverview {
  totalStudents: number;
  totalApprovedColleges: number;
  pendingCollegeRequests: number;
  monitoringAdminCount: number;
  publishedCoursesCount: number;
  assessmentAttemptsCount: number;
  averagePassRate: number;
  verifiedSkillsCount: number;
  collegeComparisons: Array<{
    collegeId: string;
    collegeName: string;
    code: string;
    studentCount: number;
    verifiedSkillsCount: number;
    averagePassRate: number;
  }>;
}

interface CollegeItem {
  id: string;
  name: string;
  code: string;
  domain?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  createdAt: string;
}

interface AffiliationRequest {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  collegeId?: string;
  collegeName?: string;
  requestedCollegeName?: string;
  officialCollegeEmail?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
  createdAt: string;
}

interface MonitoringAdminItem {
  id: string;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  assignedColleges: Array<{
    collegeId: string;
    collegeName: string;
    collegeCode: string;
    status: 'ACTIVE' | 'REVOKED';
  }>;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export const MainAdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'colleges' | 'affiliations' | 'admins' | 'content' | 'audit'>('overview');

  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [colleges, setColleges] = useState<CollegeItem[]>([]);
  const [affiliations, setAffiliations] = useState<AffiliationRequest[]>([]);
  const [admins, setAdmins] = useState<MonitoringAdminItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [collegeSearch, setCollegeSearch] = useState('');

  // Modals
  const [createCollegeOpen, setCreateCollegeOpen] = useState(false);
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeCode, setNewCollegeCode] = useState('');
  const [newCollegeDomain, setNewCollegeDomain] = useState('');

  const [inviteAdminOpen, setInviteAdminOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteCollegeIds, setInviteCollegeIds] = useState<string[]>([]);

  // Question Authoring
  const [createQuestionOpen, setCreateQuestionOpen] = useState(false);
  const [qSkillId, setQSkillId] = useState('nodejs');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrectIdx, setQCorrectIdx] = useState(0);
  const [qExplanation, setQExplanation] = useState('');
  const [qDifficulty, setQDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');

  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Overview
      const resOverview = await fetch('/api/admin/overview', { headers });
      if (resOverview.ok) {
        const body = await resOverview.json();
        setOverview(body.data);
      }

      // Colleges
      const resColleges = await fetch('/api/admin/colleges', { headers });
      if (resColleges.ok) {
        const body = await resColleges.json();
        setColleges(body.data);
      }

      // Affiliations
      const resAff = await fetch('/api/admin/affiliations', { headers });
      if (resAff.ok) {
        const body = await resAff.json();
        setAffiliations(body.data);
      }

      // Monitoring Admins
      const resAdmins = await fetch('/api/admin/monitoring-admins', { headers });
      if (resAdmins.ok) {
        const body = await resAdmins.json();
        setAdmins(body.data);
      }

      // Audit Logs
      const resAudit = await fetch('/api/admin/audit-logs', { headers });
      if (resAudit.ok) {
        const body = await resAudit.json();
        setAuditLogs(body.data);
      }
    } catch (err: any) {
      console.warn('[MainAdminDashboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch('/api/admin/colleges', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCollegeName,
          code: newCollegeCode,
          domain: newCollegeDomain || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Failed to create college');

      setActionSuccess(`College ${body.data.name} (${body.data.code}) successfully created!`);
      setCreateCollegeOpen(false);
      setNewCollegeName('');
      setNewCollegeCode('');
      setNewCollegeDomain('');
      fetchDashboardData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleReviewAffiliation = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`/api/admin/affiliations/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          reviewNotes: status === 'APPROVED' ? 'Approved by platform administrator.' : 'Rejected due to insufficient proof.',
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Failed to review affiliation');

      setActionSuccess(`Affiliation request ${status.toLowerCase()} successfully!`);
      fetchDashboardData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      if (inviteCollegeIds.length === 0) {
        throw new Error('Please select at least one assigned college.');
      }

      const res = await fetch('/api/admin/monitoring-admins/invite', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          displayName: inviteName,
          collegeIds: inviteCollegeIds,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Failed to invite administrator');

      setActionSuccess(`Monitoring Admin ${body.data.displayName} provisioned successfully!`);
      setInviteAdminOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInviteCollegeIds([]);
      fetchDashboardData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleToggleAdminStatus = async (adminId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/monitoring-admins/${adminId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        setActionSuccess(`Admin account ${!currentActive ? 'reactivated' : 'suspended'} successfully.`);
        fetchDashboardData();
      }
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      const validOptions = qOptions.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) throw new Error('At least 2 non-empty options required.');

      const res = await fetch('/api/courses/questions/bank', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skillId: qSkillId,
          questionText: qText,
          options: validOptions,
          correctOptionIndex: qCorrectIdx,
          explanation: qExplanation,
          difficulty: qDifficulty,
          marks: 2,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Failed to author question');

      setActionSuccess('Question authoring saved to Centralized Question Bank!');
      setCreateQuestionOpen(false);
      setQText('');
      setQOptions(['', '', '', '']);
      setQExplanation('');
      fetchDashboardData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-muted">Loading platform administrative console...</div>;
  }

  const filteredColleges = colleges.filter((c) =>
    c.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(collegeSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-xl p-6 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-accent-primary" />
            <h1 className="text-xl font-bold text-primary">Main Admin Console</h1>
            <span className="text-[10px] bg-accent-primary/10 border border-accent-primary/30 text-accent-primary px-2 py-0.5 rounded font-mono font-bold">
              PLATFORM ROOT
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Global management of colleges, monitoring administrators, centralized courses, and student affiliations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-primary bg-elevated px-3 py-1.5 rounded-lg border border-border"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync
          </button>
          <button
            onClick={() => setCreateCollegeOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-accent-primary hover:bg-accent-primary/90 text-base px-3.5 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New College
          </button>
          <button
            onClick={() => setInviteAdminOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-elevated hover:bg-elevated/80 border border-border text-primary px-3.5 py-1.5 rounded-lg transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5 text-accent-secondary" />
            Provision Admin
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-state-success/10 border border-state-success/30 text-state-success text-xs rounded-lg flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')}><XCircle className="h-4 w-4" /></button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-state-error/10 border border-state-error/30 text-state-error text-xs rounded-lg flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')}><XCircle className="h-4 w-4" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Platform Overview', icon: Building2 },
          { id: 'colleges', label: `Colleges (${colleges.length})`, icon: Building2 },
          { id: 'affiliations', label: `Affiliation Requests (${affiliations.filter(a => a.status === 'PENDING').length})`, icon: FileCheck },
          { id: 'admins', label: `Monitoring Admins (${admins.length})`, icon: Users },
          { id: 'content', label: 'Course & Question Authoring', icon: BookOpen },
          { id: 'audit', label: 'Audit Logs', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-accent-primary text-accent-primary bg-elevated/40'
                  : 'border-transparent text-muted hover:text-primary'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface border border-border rounded-xl p-4">
              <span className="text-[11px] text-muted">Total Enrolled Students</span>
              <div className="text-2xl font-bold text-primary mt-1">{overview.totalStudents}</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <span className="text-[11px] text-muted">Approved Partner Colleges</span>
              <div className="text-2xl font-bold text-accent-primary mt-1">{overview.totalApprovedColleges}</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <span className="text-[11px] text-muted">Pending Affiliations</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">{overview.pendingCollegeRequests}</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <span className="text-[11px] text-muted">Active Monitoring Admins</span>
              <div className="text-2xl font-bold text-accent-secondary mt-1">{overview.monitoringAdminCount}</div>
            </div>
          </div>

          {/* College Benchmarking Table */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-primary mb-3">Institutional Comparisons & Benchmark Ranks</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="py-2.5 px-3">Institution Name</th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Enrolled Students</th>
                    <th className="py-2.5 px-3">Verified Skills Issued</th>
                    <th className="py-2.5 px-3">Assessment Pass Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {overview.collegeComparisons.map((c) => (
                    <tr key={c.collegeId} className="hover:bg-elevated/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-primary">{c.collegeName}</td>
                      <td className="py-2.5 px-3 font-mono text-muted">{c.code}</td>
                      <td className="py-2.5 px-3 text-primary">{c.studentCount}</td>
                      <td className="py-2.5 px-3 text-accent-secondary font-medium">{c.verifiedSkillsCount}</td>
                      <td className="py-2.5 px-3 font-medium text-state-success">{c.averagePassRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COLLEGES */}
      {activeTab === 'colleges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted" />
              <input
                type="text"
                placeholder="Search colleges by name or code..."
                value={collegeSearch}
                onChange={(e) => setCollegeSearch(e.target.value)}
                className="w-full bg-elevated border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>
            <button
              onClick={() => setCreateCollegeOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-accent-primary text-base px-3.5 py-2 rounded-lg"
            >
              <Plus className="h-3.5 w-3.5" />
              Add College
            </button>
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-elevated/50 text-muted border-b border-border">
                <tr>
                  <th className="py-3 px-4">College Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Email Domain</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredColleges.map((c) => (
                  <tr key={c.id} className="hover:bg-elevated/30">
                    <td className="py-3 px-4 font-semibold text-primary">{c.name}</td>
                    <td className="py-3 px-4 font-mono text-accent-primary">{c.code}</td>
                    <td className="py-3 px-4 text-muted">{c.domain || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'APPROVED' ? 'bg-state-success/10 text-state-success border border-state-success/30' :
                        c.status === 'SUSPENDED' ? 'bg-state-error/10 text-state-error border border-state-error/30' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[10px] text-muted">Managed</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AFFILIATION REQUESTS */}
      {activeTab === 'affiliations' && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-bold text-primary">Student College Affiliation Verification Queue</h3>
            <span className="text-[11px] text-muted">{affiliations.length} Total Requests</span>
          </div>
          {affiliations.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">No student affiliation requests submitted yet.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-elevated/50 text-muted border-b border-border">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Student Email</th>
                  <th className="py-3 px-4">Requested College</th>
                  <th className="py-3 px-4">Official College Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {affiliations.map((req) => (
                  <tr key={req.id} className="hover:bg-elevated/30">
                    <td className="py-3 px-4 font-semibold text-primary">{req.studentName}</td>
                    <td className="py-3 px-4 text-muted">{req.studentEmail}</td>
                    <td className="py-3 px-4 text-primary font-medium">{req.collegeName || req.requestedCollegeName}</td>
                    <td className="py-3 px-4 text-accent-secondary font-mono">{req.officialCollegeEmail || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.status === 'APPROVED' ? 'bg-state-success/10 text-state-success' :
                        req.status === 'REJECTED' ? 'bg-state-error/10 text-state-error' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleReviewAffiliation(req.id, 'APPROVED')}
                            className="bg-state-success/15 hover:bg-state-success/25 text-state-success px-2.5 py-1 rounded text-[11px] font-bold transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewAffiliation(req.id, 'REJECTED')}
                            className="bg-state-error/15 hover:bg-state-error/25 text-state-error px-2.5 py-1 rounded text-[11px] font-bold transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 4: MONITORING ADMINS */}
      {activeTab === 'admins' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setInviteAdminOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-accent-primary text-base px-3.5 py-2 rounded-lg"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite Monitoring Admin
            </button>
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-elevated/50 text-muted border-b border-border">
                <tr>
                  <th className="py-3 px-4">Admin Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Assigned Colleges</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Account Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {admins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-elevated/30">
                    <td className="py-3 px-4 font-semibold text-primary">{adm.displayName}</td>
                    <td className="py-3 px-4 text-muted">{adm.email}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {adm.assignedColleges.map((col) => (
                          <span
                            key={col.collegeId}
                            className="bg-elevated border border-border text-[10px] px-2 py-0.5 rounded text-primary"
                          >
                            {col.collegeCode}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        adm.isActive ? 'bg-state-success/10 text-state-success' : 'bg-state-error/10 text-state-error'
                      }`}>
                        {adm.isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleAdminStatus(adm.id, adm.isActive)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded transition-colors ${
                          adm.isActive
                            ? 'text-state-error hover:bg-state-error/10'
                            : 'text-state-success hover:bg-state-success/10'
                        }`}
                      >
                        {adm.isActive ? 'Suspend Access' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CONTENT AUTHORING & QUESTION BANK */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-primary">Centralized Learning & Question Engine</h3>
              <p className="text-xs text-muted mt-0.5">Author standardized assessment questions and official curriculum content.</p>
            </div>
            <button
              onClick={() => setCreateQuestionOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-accent-primary text-base px-3.5 py-2 rounded-lg"
            >
              <Plus className="h-3.5 w-3.5" />
              Author Assessment Question
            </button>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <h4 className="text-xs font-bold text-primary mb-3">Published Course Curricula</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-elevated/40 border border-border rounded-lg">
                <span className="text-[10px] font-mono text-accent-primary font-bold uppercase">Backend Track</span>
                <h5 className="text-sm font-bold text-primary mt-1">Production Backend Architecture & Node.js Mastery</h5>
                <p className="text-xs text-muted mt-1">6 weeks • 3 modules • PostgreSQL, libuv event loop, RLS security.</p>
                <span className="inline-block mt-3 px-2 py-0.5 rounded bg-state-success/10 text-state-success text-[10px] font-bold">
                  PUBLISHED
                </span>
              </div>
              <div className="p-4 bg-elevated/40 border border-border rounded-lg">
                <span className="text-[10px] font-mono text-accent-secondary font-bold uppercase">Frontend Track</span>
                <h5 className="text-sm font-bold text-primary mt-1">Modern Frontend Engineering with React & TypeScript</h5>
                <p className="text-xs text-muted mt-1">5 weeks • 2 modules • Fiber reconciliation, hooks, deterministic state.</p>
                <span className="inline-block mt-3 px-2 py-0.5 rounded bg-state-success/10 text-state-success text-[10px] font-bold">
                  PUBLISHED
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-xs font-bold text-primary">Platform Administrative Activity & Security Log</h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-elevated/50 text-muted border-b border-border">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-elevated/30">
                  <td className="py-2.5 px-4 text-muted">{new Date(log.createdAt).toLocaleTimeString()}</td>
                  <td className="py-2.5 px-4 font-bold text-accent-primary">{log.actorRole}</td>
                  <td className="py-2.5 px-4 font-semibold text-primary">{log.action}</td>
                  <td className="py-2.5 px-4 text-muted">{log.targetType}</td>
                  <td className="py-2.5 px-4 text-muted truncate max-w-xs">{JSON.stringify(log.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE COLLEGE MODAL */}
      {createCollegeOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border w-full max-w-md rounded-xl p-6 relative shadow-2xl">
            <button onClick={() => setCreateCollegeOpen(false)} className="absolute top-4 right-4 text-muted hover:text-primary">
              <XCircle className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-primary mb-4">Add Approved College Partner</h3>
            <form onSubmit={handleCreateCollege} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-muted mb-1">Official College Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Carnegie Mellon University"
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  className="w-full bg-elevated border border-border rounded-lg p-2 text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="block font-medium text-muted mb-1">Short Code / Acronym</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CMU"
                  value={newCollegeCode}
                  onChange={(e) => setNewCollegeCode(e.target.value)}
                  className="w-full bg-elevated border border-border rounded-lg p-2 text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="block font-medium text-muted mb-1">Official Email Domain (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. cmu.edu"
                  value={newCollegeDomain}
                  onChange={(e) => setNewCollegeDomain(e.target.value)}
                  className="w-full bg-elevated border border-border rounded-lg p-2 text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-accent-primary hover:bg-accent-primary/90 text-base font-bold py-2 rounded-lg mt-2"
              >
                Create College Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PROVISION MONITORING ADMIN MODAL */}
      {inviteAdminOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border w-full max-w-md rounded-xl p-6 relative shadow-2xl">
            <button onClick={() => setInviteAdminOpen(false)} className="absolute top-4 right-4 text-muted hover:text-primary">
              <XCircle className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-primary mb-4">Provision Monitoring Administrator</h3>
            <form onSubmit={handleInviteAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-muted mb-1">Administrator Email</label>
                <input
                  type="email"
                  required
                  placeholder="dean@university.edu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-elevated border border-border rounded-lg p-2 text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="block font-medium text-muted mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Alan Turing"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-elevated border border-border rounded-lg p-2 text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="block font-medium text-muted mb-1">Assigned Colleges (Select at least one)</label>
                <div className="max-h-36 overflow-y-auto space-y-1 bg-elevated/40 border border-border p-2 rounded-lg">
                  {colleges.map((c) => {
                    const isChecked = inviteCollegeIds.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-elevated rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setInviteCollegeIds([...inviteCollegeIds, c.id]);
                            } else {
                              setInviteCollegeIds(inviteCollegeIds.filter((id) => id !== c.id));
                            }
                          }}
                          className="rounded text-accent-primary"
                        />
                        <span className="text-primary">{c.name} ({c.code})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-accent-primary hover:bg-accent-primary/90 text-base font-bold py-2 rounded-lg mt-2"
              >
                Provision Monitoring Admin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QUESTION AUTHORING MODAL */}
      {createQuestionOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-border w-full max-w-lg rounded-xl p-6 relative shadow-2xl my-8">
            <button onClick={() => setCreateQuestionOpen(false)} className="absolute top-4 right-4 text-muted hover:text-primary">
              <XCircle className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-primary mb-4">Author Assessment Question</h3>
            <form onSubmit={handleCreateQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-muted mb-1">Canonical Skill</label>
                  <select
                    value={qSkillId}
                    onChange={(e) => setQSkillId(e.target.value)}
                    className="w-full bg-elevated border border-border rounded-lg p-2 text-primary"
                  >
                    <option value="nodejs">Node.js</option>
                    <option value="react">React</option>
                    <option value="postgresql">PostgreSQL</option>
                    <option value="typescript">TypeScript</option>
                    <option value="docker">Docker</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-muted mb-1">Difficulty</label>
                  <select
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value as any)}
                    className="w-full bg-elevated border border-border rounded-lg p-2 text-primary"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-muted mb-1">Question Text</label>
                <textarea
                  required
                  rows={3}
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="State the technical question clearly..."
                  className="w-full bg-elevated border border-border rounded-lg p-2 text-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-medium text-muted">Answer Options & Correct Option</label>
                {qOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={qCorrectIdx === idx}
                      onChange={() => setQCorrectIdx(idx)}
                      className="text-accent-primary"
                    />
                    <input
                      type="text"
                      required
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const copy = [...qOptions];
                        copy[idx] = e.target.value;
                        setQOptions(copy);
                      }}
                      className="flex-1 bg-elevated border border-border rounded-lg p-2 text-primary"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-medium text-muted mb-1">Explanation</label>
                <textarea
                  rows={2}
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Explain why the selected option is correct..."
                  className="w-full bg-elevated border border-border rounded-lg p-2 text-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-accent-primary hover:bg-accent-primary/90 text-base font-bold py-2.5 rounded-lg mt-2"
              >
                Register into Centralized Question Bank
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

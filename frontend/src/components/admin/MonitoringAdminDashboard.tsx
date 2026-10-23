import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  AlertTriangle,
  Search,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

interface AssignedCollege {
  id: string;
  name: string;
  code: string;
  domain?: string;
  status: string;
}

interface CollegeAnalytics {
  college: AssignedCollege;
  verifiedStudentCount: number;
  pendingStudentCount: number;
  totalAssessments: number;
  passingRate: number;
  topVerifiedSkills: Array<{ skillId: string; name: string; count: number }>;
  skillGaps: Array<{ skillId: string; name: string; unverifiedCount: number; failureCount: number }>;
  topStudents: Array<{ userId: string; name: string; score: number; verifiedSkillsCount: number }>;
}

interface StudentItem {
  id: string;
  displayName: string;
  email: string;
  officialCollegeEmail?: string;
  affiliationStatus: string;
  careerGoal?: string;
  createdAt: string;
}

export const MonitoringAdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const [assignedColleges, setAssignedColleges] = useState<AssignedCollege[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');
  const [analytics, setAnalytics] = useState<CollegeAnalytics | null>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch assigned colleges
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/colleges/monitoring/assigned', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((body) => {
        if (body.success && Array.isArray(body.data)) {
          setAssignedColleges(body.data);
          if (body.data.length > 0) {
            setSelectedCollegeId(body.data[0].id);
          }
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // 2. Fetch college analytics and student roster for selected college
  const fetchCollegeData = async (collegeId: string) => {
    if (!token || !collegeId) return;
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Analytics
      const resAnalytics = await fetch(`/api/colleges/monitoring/${collegeId}/analytics`, { headers });
      if (!resAnalytics.ok) {
        const body = await resAnalytics.json();
        throw new Error(body.error?.message || 'Access denied for this college.');
      }
      const analyticsBody = await resAnalytics.json();
      setAnalytics(analyticsBody.data);

      // Student roster
      const resStudents = await fetch(`/api/colleges/monitoring/${collegeId}/students`, { headers });
      if (resStudents.ok) {
        const studentsBody = await resStudents.json();
        setStudents(studentsBody.data);
      }
    } catch (err: any) {
      setError(err.message);
      setAnalytics(null);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCollegeId) {
      fetchCollegeData(selectedCollegeId);
    }
  }, [selectedCollegeId, token]);

  const handleExportCsv = async () => {
    if (!token || !selectedCollegeId) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/colleges/monitoring/${selectedCollegeId}/export-csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('CSV Export failed or forbidden.');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `college-monitoring-report-${selectedCollegeId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.officialCollegeEmail && s.officialCollegeEmail.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading && !analytics) {
    return <div className="p-12 text-center text-xs text-muted">Loading authorized college monitoring portal...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header & College Selector */}
      <div className="bg-surface rounded-xl p-6 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-accent-secondary" />
            <h1 className="text-xl font-bold text-primary">College Monitoring Portal</h1>
            <span className="text-[10px] bg-accent-secondary/10 border border-accent-secondary/30 text-accent-secondary px-2 py-0.5 rounded font-mono font-bold">
              AUTHORIZED MONITORING
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Institutional overview of verified learner progress, skill gaps, and assessment metrics for your assigned colleges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {assignedColleges.length > 1 ? (
            <select
              value={selectedCollegeId}
              onChange={(e) => setSelectedCollegeId(e.target.value)}
              className="bg-elevated border border-border text-xs text-primary rounded-lg px-3 py-2 focus:outline-none focus:border-accent-secondary"
            >
              {assignedColleges.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name} ({col.code})
                </option>
              ))}
            </select>
          ) : assignedColleges.length === 1 ? (
            <div className="px-3 py-1.5 bg-elevated border border-border rounded-lg text-xs font-semibold text-primary">
              {assignedColleges[0].name} ({assignedColleges[0].code})
            </div>
          ) : null}

          <button
            onClick={handleExportCsv}
            disabled={exporting || !selectedCollegeId}
            className="flex items-center gap-2 bg-accent-secondary/15 hover:bg-accent-secondary/25 border border-accent-secondary/40 text-accent-secondary text-xs font-bold px-3.5 py-2 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exporting ? 'Generating CSV...' : 'Export College CSV'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-state-error/10 border border-state-error/30 text-state-error text-xs rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* College Metrics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-xl p-4">
            <span className="text-[11px] text-muted">Verified Affiliated Students</span>
            <div className="text-2xl font-bold text-primary mt-1">{analytics.verifiedStudentCount}</div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <span className="text-[11px] text-muted">Pending Affiliations</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{analytics.pendingStudentCount}</div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <span className="text-[11px] text-muted">Total Assessments Completed</span>
            <div className="text-2xl font-bold text-accent-secondary mt-1">{analytics.totalAssessments}</div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <span className="text-[11px] text-muted">Institutional Pass Rate</span>
            <div className="text-2xl font-bold text-state-success mt-1">{analytics.passingRate}%</div>
          </div>
        </div>
      )}

      {/* Skill Gaps & Verified Skills Analysis */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Verified Skills */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-state-success" />
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Top Verified Competencies</h3>
            </div>
            <div className="space-y-2.5">
              {analytics.topVerifiedSkills.map((sk) => (
                <div key={sk.skillId} className="flex items-center justify-between p-2.5 bg-elevated/40 rounded-lg border border-border/60">
                  <span className="text-xs font-medium text-primary">{sk.name || sk.skillId}</span>
                  <span className="text-[11px] font-mono text-state-success font-bold bg-state-success/10 px-2 py-0.5 rounded">
                    {sk.count} verified
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Identified Institutional Skill Gaps */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Target Remediation Skill Gaps</h3>
            </div>
            <div className="space-y-2.5">
              {analytics.skillGaps.map((sk) => (
                <div key={sk.skillId} className="flex items-center justify-between p-2.5 bg-elevated/40 rounded-lg border border-border/60">
                  <span className="text-xs font-medium text-primary">{sk.name || sk.skillId}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                      {sk.unverifiedCount} unverified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Verified Student Roster Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-primary">Enrolled Student Roster ({filteredStudents.length})</h3>
            <p className="text-[11px] text-muted">Only learners with verified institutional affiliation appear in official monitoring reports.</p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-elevated border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-primary focus:outline-none focus:border-accent-secondary"
            />
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted">
            No verified students found for this college matching your search.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-elevated/50 text-muted border-b border-border">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Primary Email</th>
                <th className="py-3 px-4">Official College Email</th>
                <th className="py-3 px-4">Career Goal</th>
                <th className="py-3 px-4 text-right">Affiliation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-elevated/30">
                  <td className="py-3 px-4 font-semibold text-primary">{s.displayName}</td>
                  <td className="py-3 px-4 text-muted">{s.email}</td>
                  <td className="py-3 px-4 text-accent-secondary font-mono">{s.officialCollegeEmail || '—'}</td>
                  <td className="py-3 px-4 text-muted truncate max-w-xs">{s.careerGoal || 'Full-Stack Developer'}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-state-success/10 text-state-success">
                      VERIFIED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

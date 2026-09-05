import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  Filter,
  Zap,
  Target,
  FileText,
  Building2,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import {
  JobPosting,
  CareerGapAnalysis,
  fetchJobPostings,
  analyzeJobMatch,
  analyzeJobMatchText,
} from '../../lib/careerApi';
import { useAuth } from '../../context/AuthContext';

interface JobAnalyzerViewProps {
  onNavigateToRoadmap?: (domainSlug: string, skillId?: string) => void;
}

export const JobAnalyzerView: React.FC<JobAnalyzerViewProps> = ({ onNavigateToRoadmap }) => {
  const { token } = useAuth();

  const [benchmarkJobs, setBenchmarkJobs] = useState<JobPosting[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [analysisMode, setAnalysisMode] = useState<'benchmark' | 'custom'>('benchmark');

  // Custom job fields
  const [customTitle, setCustomTitle] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [customDomain, setCustomDomain] = useState('backend-developer');
  const [customDescription, setCustomDescription] = useState('');

  // Analysis State
  const [analysis, setAnalysis] = useState<CareerGapAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Tabs in Result Panel
  const [activeTab, setActiveTab] = useState<'gaps' | 'matrix' | 'posting'>('gaps');
  const [filterImportance, setFilterImportance] = useState<'ALL' | 'REQUIRED' | 'PREFERRED'>('ALL');

  // Load benchmark jobs on mount
  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        const jobs = await fetchJobPostings();
        setBenchmarkJobs(jobs);
        if (jobs.length > 0) {
          setSelectedJobId(jobs[0].id);
          // Automatically run initial analysis for the first benchmark job
          runJobAnalysis(jobs[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load benchmark jobs');
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  const runJobAnalysis = async (jobId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await analyzeJobMatch(jobId, token || undefined);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze job match');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDescription.trim()) {
      setError('Please provide a job description to analyze.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await analyzeJobMatchText(
        customDescription,
        customDomain,
        token || undefined
      );
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze custom job text');
    } finally {
      setLoading(false);
    }
  };

  const getReadinessTierBadge = (tier: string) => {
    switch (tier) {
      case 'HIGH':
        return (
          <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-full bg-state-success/15 text-state-success border border-state-success/30 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            High Readiness (Interview Ready)
          </span>
        );
      case 'MODERATE':
        return (
          <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-full bg-state-warning/15 text-state-warning border border-state-warning/30 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Moderate Readiness (Closing Gaps)
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-full bg-state-error/15 text-state-error border border-state-error/30 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            Low Readiness (Foundations Needed)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-full bg-muted/15 text-muted border border-border flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Developing (Early Stage)
          </span>
        );
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'IMMEDIATE_QUICK_WIN':
        return 'bg-state-success/10 text-state-success border-state-success/30';
      case 'HIGH_PRIORITY':
        return 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';
      case 'MEDIUM_PRIORITY':
        return 'bg-state-warning/10 text-state-warning border-state-warning/30';
      default:
        return 'bg-muted/10 text-muted border-border';
    }
  };

  const filteredMatchedSkills = (analysis?.jobMatch.matchedSkills || []).filter((s) =>
    filterImportance === 'ALL' ? true : s.importance === filterImportance
  );

  const filteredMissingSkills = (analysis?.jobMatch.missingSkills || []).filter((s) =>
    filterImportance === 'ALL' ? true : s.importance === filterImportance
  );

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-accent-primary uppercase tracking-wider">
              <Briefcase className="h-4 w-4" />
              <span>Phase 4 — Deterministic Career Match & Gap Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              Job Analyzer & Readiness Dashboard
            </h1>
            <p className="text-sm text-muted max-w-2xl leading-relaxed">
              Match your verified competencies against industry job descriptions. Identify missing
              prerequisites, discover immediate quick wins, and follow authoritative roadmap learning bridges.
            </p>
          </div>

          {/* Core Invariant Callout */}
          <div className="bg-surface-elevated/70 border border-border/80 rounded-xl p-4 max-w-xs flex-shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-state-warning mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span>Deterministic Match Guarantee</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Match scores are computed strictly from verified tests (<span className="text-state-success font-mono">&ge; 80%</span>). Unverified and claimed skills earn 0 points.
            </p>
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Job Selector & Input (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Target className="h-4 w-4 text-accent-primary" />
                Select Target Job
              </h2>
              <div className="flex bg-surface-elevated p-0.5 rounded-lg border border-border text-xs">
                <button
                  onClick={() => setAnalysisMode('benchmark')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    analysisMode === 'benchmark'
                      ? 'bg-accent-primary text-base font-semibold shadow-sm'
                      : 'text-muted hover:text-primary'
                  }`}
                >
                  Benchmark
                </button>
                <button
                  onClick={() => setAnalysisMode('custom')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    analysisMode === 'custom'
                      ? 'bg-accent-primary text-base font-semibold shadow-sm'
                      : 'text-muted hover:text-primary'
                  }`}
                >
                  Paste Custom
                </button>
              </div>
            </div>

            {analysisMode === 'benchmark' ? (
              <div className="space-y-3">
                <p className="text-xs text-muted">
                  Select a standardized industry role to analyze your current readiness:
                </p>
                <div className="space-y-2">
                  {benchmarkJobs.map((job) => {
                    const isSelected = selectedJobId === job.id;
                    return (
                      <button
                        key={job.id}
                        onClick={() => {
                          setSelectedJobId(job.id);
                          runJobAnalysis(job.id);
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-accent-primary/10 border-accent-primary text-primary shadow-sm'
                            : 'bg-surface-elevated border-border text-muted hover:border-border-focus hover:text-primary'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-semibold text-primary">{job.title}</h3>
                            <p className="text-xs text-muted flex items-center gap-1.5 mt-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {job.company}
                              <span className="text-border">•</span>
                              <MapPin className="h-3 w-3" />
                              {job.location}
                            </p>
                          </div>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface border border-border text-accent-primary">
                            {job.domainSlug.split('-')[0]}
                          </span>
                        </div>
                        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-muted">
                          <span>{job.requiredSkills.length} Required Skills</span>
                          <span>•</span>
                          <span>{job.preferredSkills.length} Preferred</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <form onSubmit={handleAnalyzeCustom} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    placeholder="e.g. Stripe, OpenAI, Google"
                    className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Primary Domain Track
                  </label>
                  <select
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-primary focus:outline-none focus:border-accent-primary"
                  >
                    <option value="backend-developer">Backend Developer</option>
                    <option value="frontend-developer">Frontend Developer</option>
                    <option value="ai-data-engineer">AI & Data Engineer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Raw Job Description Text
                  </label>
                  <textarea
                    rows={6}
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Paste job posting requirements, qualifications, and nice-to-have sections..."
                    className="w-full bg-surface-elevated border border-border rounded-lg p-3 text-xs text-primary focus:outline-none focus:border-accent-primary font-mono leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !customDescription.trim()}
                  className="w-full py-2.5 bg-accent-primary hover:bg-accent-primary/90 text-base font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>Extract Skills & Analyze Match</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Readiness Score Dashboard & Gap Actions (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-state-error/15 border border-state-error/30 text-state-error text-xs flex items-center gap-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {analysis ? (
            <div className="space-y-6">
              {/* Top Match Score Card */}
              <div className="bg-surface rounded-xl border border-border p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
                  <div>
                    <h2 className="text-xl font-bold text-primary">
                      {analysis.jobMatch.jobTitle}
                    </h2>
                    <p className="text-xs text-muted mt-1 flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5" />
                      {analysis.jobMatch.company}
                      <span className="text-border">•</span>
                      <span className="uppercase font-mono text-accent-primary">
                        {analysis.jobMatch.domainSlug}
                      </span>
                    </p>
                  </div>
                  {getReadinessTierBadge(analysis.jobMatch.readinessTier)}
                </div>

                {/* Score Dial & Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Overall Match Gauge */}
                  <div className="bg-surface-elevated rounded-xl p-4 border border-border flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full border-4 border-accent-primary/20 flex items-center justify-center relative flex-shrink-0">
                      <div
                        className={`h-full w-full rounded-full border-4 ${
                          analysis.jobMatch.matchScore >= 80
                            ? 'border-state-success'
                            : analysis.jobMatch.matchScore >= 60
                            ? 'border-state-warning'
                            : 'border-state-error'
                        } flex items-center justify-center`}
                      >
                        <span className="text-lg font-bold font-mono text-primary">
                          {analysis.jobMatch.matchScore}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-primary">Verified Match Score</h4>
                      <p className="text-[11px] text-muted mt-0.5">
                        Authoritative weighted coverage
                      </p>
                    </div>
                  </div>

                  {/* Required Skills Met */}
                  <div className="bg-surface-elevated rounded-xl p-4 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted uppercase">Required Met</span>
                      <span className="text-xs font-bold font-mono text-primary">
                        {analysis.jobMatch.requiredSkillsMet} / {analysis.jobMatch.requiredSkillsTotal}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border/50">
                      <div
                        className="h-full bg-accent-primary transition-all duration-500"
                        style={{
                          width: `${
                            analysis.jobMatch.requiredSkillsTotal > 0
                              ? (analysis.jobMatch.requiredSkillsMet / analysis.jobMatch.requiredSkillsTotal) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-muted mt-2">
                      Score: <span className="font-mono text-primary">{analysis.jobMatch.requiredMatchScore}%</span>
                    </p>
                  </div>

                  {/* Preferred Skills Met */}
                  <div className="bg-surface-elevated rounded-xl p-4 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted uppercase">Preferred Met</span>
                      <span className="text-xs font-bold font-mono text-primary">
                        {analysis.jobMatch.preferredSkillsMet} / {analysis.jobMatch.preferredSkillsTotal}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border/50">
                      <div
                        className="h-full bg-state-warning transition-all duration-500"
                        style={{
                          width: `${
                            analysis.jobMatch.preferredSkillsTotal > 0
                              ? (analysis.jobMatch.preferredSkillsMet / analysis.jobMatch.preferredSkillsTotal) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-muted mt-2">
                      Score: <span className="font-mono text-primary">{analysis.jobMatch.preferredMatchScore}%</span>
                    </p>
                  </div>
                </div>

                {/* Quick Wins Highlight Banner */}
                {analysis.quickWinsCount > 0 && (
                  <div className="bg-state-success/10 border border-state-success/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-state-success flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-state-success uppercase tracking-wider">
                          {analysis.quickWinsCount} Immediate Quick Win{analysis.quickWinsCount > 1 ? 's' : ''} Available
                        </h4>
                        <p className="text-xs text-muted mt-0.5">
                          Prerequisites satisfied! You can take the 15-minute verification assessment now to instantly boost your match score.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('gaps')}
                      className="px-3.5 py-1.5 bg-state-success hover:bg-state-success/90 text-base font-bold text-xs rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
                    >
                      View Quick Wins
                    </button>
                  </div>
                )}
              </div>

              {/* Action Tabs Header */}
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('gaps')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                      activeTab === 'gaps'
                        ? 'bg-accent-primary text-base font-semibold'
                        : 'text-muted hover:text-primary'
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Prioritized Gap Plan ({analysis.recommendations.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('matrix')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                      activeTab === 'matrix'
                        ? 'bg-accent-primary text-base font-semibold'
                        : 'text-muted hover:text-primary'
                    }`}
                  >
                    <Target className="h-3.5 w-3.5" />
                    <span>Requirement Matrix</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('posting')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                      activeTab === 'posting'
                        ? 'bg-accent-primary text-base font-semibold'
                        : 'text-muted hover:text-primary'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Job Description</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Prioritized Gap Plan */}
              {activeTab === 'gaps' && (
                <div className="space-y-4">
                  {analysis.recommendations.length === 0 ? (
                    <div className="p-8 text-center bg-surface rounded-xl border border-border space-y-2">
                      <CheckCircle2 className="h-8 w-8 text-state-success mx-auto" />
                      <h3 className="text-sm font-bold text-primary">All Requirements Satisfied!</h3>
                      <p className="text-xs text-muted">
                        You have verified 100% of the competencies requested by this job posting.
                      </p>
                    </div>
                  ) : (
                    analysis.recommendations.map((rec, idx) => (
                      <div
                        key={rec.skillId || idx}
                        className={`p-5 rounded-xl border transition-all ${
                          rec.isReadyToAssess
                            ? 'bg-surface-elevated/80 border-state-success/40'
                            : 'bg-surface border-border hover:border-border-focus'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityColor(
                                  rec.priority
                                )}`}
                              >
                                {rec.priority.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface border border-border text-muted">
                                {rec.category}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-state-success bg-state-success/15 px-2 py-0.5 rounded">
                                +{rec.scorePotentialGain}% Score Gain
                              </span>
                            </div>

                            <h3 className="text-base font-bold text-primary">{rec.skillName}</h3>
                            <p className="text-xs text-muted leading-relaxed max-w-xl">
                              {rec.actionTip}
                            </p>
                          </div>

                          {/* Roadmap Bridge Button */}
                          <div className="flex-shrink-0">
                            {onNavigateToRoadmap ? (
                              <button
                                onClick={() =>
                                  onNavigateToRoadmap(rec.domainSlug, rec.skillId)
                                }
                                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                                  rec.isReadyToAssess
                                    ? 'bg-state-success hover:bg-state-success/90 text-base font-bold shadow-sm'
                                    : 'bg-surface-elevated hover:bg-border text-primary border border-border'
                                }`}
                              >
                                <BookOpen className="h-3.5 w-3.5" />
                                <span>{rec.isReadyToAssess ? 'Take Assessment' : 'Open in Roadmap'}</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <a
                                href={rec.roadmapUrl}
                                className="px-4 py-2 bg-surface-elevated hover:bg-border text-primary border border-border text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
                              >
                                <BookOpen className="h-3.5 w-3.5" />
                                <span>Roadmap Path</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Prerequisite Path Dependency Chain */}
                        {rec.prerequisiteChain.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-border/60">
                            <h4 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                              Prerequisite Graph Path:
                            </h4>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {rec.prerequisiteChain.map((step, pIdx) => (
                                <React.Fragment key={step.skillId}>
                                  <div
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 border ${
                                      step.isVerified
                                        ? 'bg-state-success/10 border-state-success/30 text-state-success'
                                        : step.status === 'AVAILABLE'
                                        ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary'
                                        : 'bg-surface border-border text-muted'
                                    }`}
                                  >
                                    {step.isVerified ? (
                                      <CheckCircle2 className="h-3 w-3" />
                                    ) : (
                                      <Clock className="h-3 w-3" />
                                    )}
                                    <span>{step.skillName}</span>
                                  </div>
                                  {pIdx < rec.prerequisiteChain.length - 1 && (
                                    <ChevronRight className="h-3 w-3 text-border" />
                                  )}
                                </React.Fragment>
                              ))}
                              <ChevronRight className="h-3 w-3 text-border" />
                              <div className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-accent-primary/20 border border-accent-primary text-primary">
                                {rec.skillName} (Goal)
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: Requirement Match Matrix */}
              {activeTab === 'matrix' && (
                <div className="space-y-4">
                  {/* Filter Toolbar */}
                  <div className="flex items-center justify-between bg-surface p-3 rounded-xl border border-border">
                    <span className="text-xs text-muted flex items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5" />
                      Filter Requirements:
                    </span>
                    <div className="flex gap-1">
                      {(['ALL', 'REQUIRED', 'PREFERRED'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setFilterImportance(f)}
                          className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                            filterImportance === f
                              ? 'bg-accent-primary text-base font-semibold'
                              : 'text-muted hover:text-primary'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Matched / Verified Skills */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-state-success uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified Competencies ({filteredMatchedSkills.length})
                    </h3>
                    <div className="space-y-2">
                      {filteredMatchedSkills.length === 0 ? (
                        <p className="text-xs text-muted p-3 bg-surface rounded-lg border border-border">
                          No verified skills matched in this category.
                        </p>
                      ) : (
                        filteredMatchedSkills.map((s) => (
                          <div
                            key={s.requirementId}
                            className="p-3.5 bg-surface rounded-xl border border-state-success/30 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="h-4 w-4 text-state-success flex-shrink-0" />
                              <div>
                                <h4 className="text-xs font-bold text-primary">{s.skillName}</h4>
                                <p className="text-[11px] text-muted">
                                  {s.importance} • Weight: {s.weight}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {s.proofId && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-muted border border-border">
                                  {s.proofId}
                                </span>
                              )}
                              <span className="text-xs font-mono font-bold text-state-success bg-state-success/15 px-2.5 py-1 rounded-lg">
                                {s.verificationScore}% VERIFIED
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Missing / Unverified Skills */}
                  <div className="space-y-2 pt-4">
                    <h3 className="text-xs font-bold text-state-error uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Missing / Unmet Requirements ({filteredMissingSkills.length})
                    </h3>
                    <div className="space-y-2">
                      {filteredMissingSkills.length === 0 ? (
                        <p className="text-xs text-muted p-3 bg-surface rounded-lg border border-border">
                          No missing requirements.
                        </p>
                      ) : (
                        filteredMissingSkills.map((s) => (
                          <div
                            key={s.requirementId}
                            className="p-3.5 bg-surface rounded-xl border border-border flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <AlertCircle className="h-4 w-4 text-muted flex-shrink-0" />
                              <div>
                                <h4 className="text-xs font-semibold text-primary">{s.skillName}</h4>
                                <p className="text-[11px] text-muted">
                                  {s.importance} • Weight: {s.weight}
                                </p>
                              </div>
                            </div>
                            <div>
                              {s.status === 'CLAIMED' ? (
                                <span className="text-xs font-mono text-state-warning bg-state-warning/15 px-2.5 py-1 rounded-lg">
                                  CLAIMED (UNVERIFIED)
                                </span>
                              ) : (
                                <span className="text-xs font-mono text-muted bg-surface-elevated px-2.5 py-1 rounded-lg border border-border">
                                  NOT STARTED
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Raw Job Description */}
              {activeTab === 'posting' && (
                <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <h3 className="text-sm font-bold text-primary">Original Job Description</h3>
                    <span className="text-xs font-mono text-muted">
                      Analyzed: {new Date(analysis.generatedAt).toLocaleString()}
                    </span>
                  </div>
                  <pre className="text-xs font-mono text-muted whitespace-pre-wrap leading-relaxed bg-surface-elevated p-4 rounded-xl border border-border">
                    {benchmarkJobs.find((j) => j.id === analysis.jobMatch.jobId)?.rawDescription ||
                      customDescription ||
                      'Custom job text'}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-surface rounded-xl border border-border space-y-3">
              <Search className="h-8 w-8 text-muted mx-auto" />
              <h3 className="text-sm font-bold text-primary">No Job Analyzed Yet</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Select a benchmark job or paste a custom description on the left to generate your career match analysis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

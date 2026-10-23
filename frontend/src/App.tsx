import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { RoadmapView } from './components/roadmap';
import { PortfolioView } from './components/portfolio';
import { JobAnalyzerView } from './components/career';
import { MockInterviewView } from './components/interview';
import { LeaderboardView } from './components/ranking';
import { ResumeView } from './components/resume';
import { DomainDiagnosticView } from './components/diagnostic';
import { MainAdminDashboard, MonitoringAdminDashboard } from './components/admin';
import { CourseCatalogView } from './components/courses';
import {
  Terminal,
  Shield,
  Cpu,
  BookOpen,
  Award,
  Target,
  MessageSquare,
  BarChart3,
  LogIn,
  LogOut,
  UserCheck,
  ArrowRight,
  FileText,
  Building2,
  ShieldCheck,
  School,
} from 'lucide-react';

type NavView =
  | 'dashboard'
  | 'courses'
  | 'roadmap'
  | 'resume'
  | 'diagnostic'
  | 'assessment'
  | 'career'
  | 'interview'
  | 'leaderboard'
  | 'mainAdmin'
  | 'monitoringAdmin';

interface HealthStatus {
  status: string;
  name: string;
  timestamp: string;
  environment: string;
  supabaseConfigured: boolean;
}

function MainApp() {
  const [activeView, setActiveView] = useState<NavView>('dashboard');
  const [roadmapTarget, setRoadmapTarget] = useState<{ domainSlug?: string; skillId?: string } | null>(null);
  const [diagnosticTarget, setDiagnosticTarget] = useState<{ domainSlug?: string; targetSkillIds?: string[] } | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data: HealthStatus) => {
        setHealth(data);
        setLoading(false);
      })
      .catch(() => {
        setHealth(null);
        setLoading(false);
      });
  }, []);

  const isMainAdmin = user?.role === 'MAIN_ADMIN' || user?.role === 'admin';
  const isMonitoringAdmin = user?.role === 'MONITORING_ADMIN' || isMainAdmin;

  const navItems = [
    { id: 'dashboard' as NavView, label: 'Dashboard', icon: Terminal },
    { id: 'courses' as NavView, label: 'Course Catalog', icon: BookOpen },
    { id: 'roadmap' as NavView, label: 'Roadmap', icon: Cpu },
    { id: 'resume' as NavView, label: 'Resume Ingestion', icon: FileText },
    { id: 'diagnostic' as NavView, label: 'Domain Diagnostic', icon: Award },
    { id: 'assessment' as NavView, label: 'Verified Portfolio', icon: Shield },
    { id: 'career' as NavView, label: 'Career Gap', icon: Target },
    { id: 'interview' as NavView, label: 'AI Mock Interview', icon: MessageSquare },
    { id: 'leaderboard' as NavView, label: 'Leaderboard', icon: BarChart3 },
    ...(isMonitoringAdmin ? [{ id: 'monitoringAdmin' as NavView, label: 'College Portal', icon: Building2 }] : []),
    ...(isMainAdmin ? [{ id: 'mainAdmin' as NavView, label: 'Main Admin', icon: ShieldCheck }] : []),
  ];

  return (
    <div className="min-h-screen bg-base text-primary flex">
      {/* Sidebar navigation shell */}
      <aside className="w-64 bg-surface border-r border-border p-4 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="flex items-center gap-3 px-3 py-2 mb-6">
            <Cpu className="h-6 w-6 text-accent-primary" />
            <span className="font-bold text-lg tracking-tight">Hiresense_AI</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              const isAdminTab = item.id === 'mainAdmin' || item.id === 'monitoringAdmin';
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left font-medium ${
                    isActive
                      ? isAdminTab
                        ? 'bg-elevated text-accent-secondary border border-accent-secondary/30'
                        : 'bg-elevated text-accent-primary'
                      : isAdminTab
                      ? 'text-accent-secondary/80 hover:text-accent-secondary hover:bg-elevated/50'
                      : 'text-muted hover:text-primary hover:bg-elevated/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>API Status</span>
            {loading ? (
              <span className="text-state-warning">Connecting...</span>
            ) : health ? (
              <span className="text-state-success flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-state-success animate-pulse"></span>
                Connected
              </span>
            ) : (
              <span className="text-state-error">Disconnected</span>
            )}
          </div>
        </div>
      </aside>

      {/* Main content container */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-surface/50 px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 md:hidden">
              <Cpu className="h-5 w-5 text-accent-primary" />
              <span className="font-bold text-sm">Hiresense</span>
            </div>
            <h1 className="text-xs font-medium text-muted hidden sm:block">
              Hiresense_AI — Multi-College Competency Verification Platform
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-primary bg-elevated px-3 py-1.5 rounded-md border border-border">
                  <UserCheck className="h-3.5 w-3.5 text-state-success" />
                  <span className="font-medium">{user.displayName}</span>
                  <span className="text-muted capitalize">({user.role})</span>

                  {user.institution && (
                    <span className="text-[10px] text-accent-secondary border-l border-border pl-2 font-mono flex items-center gap-1">
                      <School className="h-3 w-3" />
                      {user.institution}
                      {user.affiliationStatus === 'VERIFIED' && (
                        <span className="text-[9px] text-state-success font-bold bg-state-success/10 px-1 rounded">
                          VERIFIED
                        </span>
                      )}
                      {user.affiliationStatus === 'PENDING_VERIFICATION' && (
                        <span className="text-[9px] text-amber-400 font-bold bg-amber-500/10 px-1 rounded">
                          PENDING
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 text-xs text-muted hover:text-state-error transition-colors px-2 py-1"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary/90 text-base font-semibold text-xs px-3.5 py-1.5 rounded-md transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In / Register
              </button>
            )}
          </div>
        </header>

        {/* Dynamic View Body */}
        <div className="p-6 max-w-6xl mx-auto w-full flex-1">
          {activeView === 'courses' ? (
            <CourseCatalogView
              onNavigateToRoadmap={(domainSlug) => {
                setRoadmapTarget({ domainSlug });
                setActiveView('roadmap');
              }}
              onNavigateToDiagnostic={(domainSlug) => {
                setDiagnosticTarget({ domainSlug });
                setActiveView('diagnostic');
              }}
            />
          ) : activeView === 'mainAdmin' ? (
            <MainAdminDashboard />
          ) : activeView === 'monitoringAdmin' ? (
            <MonitoringAdminDashboard />
          ) : activeView === 'roadmap' ? (
            <RoadmapView
              initialDomainSlug={roadmapTarget?.domainSlug}
              initialSkillId={roadmapTarget?.skillId}
            />
          ) : activeView === 'resume' ? (
            <ResumeView
              onNavigateToRoadmap={(domainSlug, skillId) => {
                setRoadmapTarget({ domainSlug, skillId });
                setActiveView('roadmap');
              }}
              onNavigateToDiagnostic={(domainSlug, targetSkillIds) => {
                setDiagnosticTarget({ domainSlug, targetSkillIds });
                setActiveView('diagnostic');
              }}
            />
          ) : activeView === 'diagnostic' ? (
            <DomainDiagnosticView
              initialDomainSlug={diagnosticTarget?.domainSlug}
              initialTargetSkillIds={diagnosticTarget?.targetSkillIds}
              onNavigateToRoadmap={(domainSlug, skillId) => {
                setRoadmapTarget({ domainSlug, skillId });
                setActiveView('roadmap');
              }}
              onNavigateToPortfolio={() => setActiveView('assessment')}
              onOpenAuthModal={() => setAuthModalOpen(true)}
            />
          ) : activeView === 'assessment' ? (
            <PortfolioView />
          ) : activeView === 'career' ? (
            <JobAnalyzerView
              onNavigateToRoadmap={(domainSlug, skillId) => {
                setRoadmapTarget({ domainSlug, skillId });
                setActiveView('roadmap');
              }}
            />
          ) : activeView === 'interview' ? (
            <MockInterviewView
              onNavigateToRoadmap={(domainSlug, skillId) => {
                setRoadmapTarget({ domainSlug, skillId });
                setActiveView('roadmap');
              }}
            />
          ) : activeView === 'leaderboard' ? (
            <LeaderboardView
              onNavigateToRoadmap={() => setActiveView('roadmap')}
              onNavigateToInterview={() => setActiveView('interview')}
            />
          ) : activeView === 'dashboard' ? (
            <div className="space-y-6">
              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-primary">Hiresense_AI Multi-College Workspace</h2>
                    <p className="text-sm text-muted mt-1">
                      Learn Courses → Assess → Verify → Build Competency Profile → Benchmark Institution → Practice Interview
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-accent-secondary" />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-elevated to-surface rounded-xl p-5 border border-accent-primary/30 flex flex-col justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-primary px-2 py-0.5 rounded bg-accent-primary/10 border border-accent-primary/20">
                      Curriculum
                    </span>
                    <h3 className="text-base font-bold text-primary mt-2">Centralized Courses</h3>
                    <p className="text-xs text-muted mt-1">
                      Browse official modular courses, verified resources, and direct skill assessments.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveView('courses')}
                    className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary/90 text-base font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap self-start"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Open Catalog</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="bg-gradient-to-r from-elevated to-surface rounded-xl p-5 border border-accent-primary/30 flex flex-col justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-primary px-2 py-0.5 rounded bg-accent-primary/10 border border-accent-primary/20">
                      Skill Graph
                    </span>
                    <h3 className="text-base font-bold text-primary mt-2">Explore Learning Roadmaps</h3>
                    <p className="text-xs text-muted mt-1">
                      Browse prerequisite-aware DAG skill graphs across Backend, Frontend, and AI tracks.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveView('roadmap')}
                    className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary/90 text-base font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap self-start"
                  >
                    <Cpu className="h-4 w-4" />
                    <span>Open Roadmap</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="bg-gradient-to-r from-elevated to-surface rounded-xl p-5 border border-amber-500/30 flex flex-col justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      Resume Ingestion
                    </span>
                    <h3 className="text-base font-bold text-primary mt-2">Upload Candidate Resume</h3>
                    <p className="text-xs text-muted mt-1">
                      Extract structured experience and detect taxonomy skills as unverified self-claims.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveView('resume')}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap self-start"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Upload Resume</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="bg-gradient-to-r from-elevated to-surface rounded-xl p-5 border border-purple-500/30 flex flex-col justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                      Domain Diagnostic
                    </span>
                    <h3 className="text-base font-bold text-primary mt-2">Assess Domain Mastery</h3>
                    <p className="text-xs text-muted mt-1">
                      Take multi-skill diagnostic assessments, earn cryptographic proofs, and verify claims.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveView('diagnostic')}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap self-start"
                  >
                    <Award className="h-4 w-4" />
                    <span>Take Diagnostic</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;

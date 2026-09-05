import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { RoadmapView } from './components/roadmap';
import { PortfolioView } from './components/portfolio';
import { JobAnalyzerView } from './components/career';
import { MockInterviewView } from './components/interview';
import { Terminal, Shield, Cpu, BookOpen, Award, Target, MessageSquare, BarChart3, LogIn, LogOut, UserCheck, ArrowRight } from 'lucide-react';

type NavView = 'dashboard' | 'roadmap' | 'assessment' | 'career' | 'interview' | 'leaderboard';

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

  const navItems = [
    { id: 'dashboard' as NavView, label: 'Dashboard', icon: Terminal },
    { id: 'roadmap' as NavView, label: 'Roadmap', icon: BookOpen },
    { id: 'assessment' as NavView, label: 'Verified Portfolio', icon: Shield },
    { id: 'career' as NavView, label: 'Career Gap', icon: Target },
    { id: 'interview' as NavView, label: 'AI Mock Interview', icon: MessageSquare },
    { id: 'leaderboard' as NavView, label: 'Leaderboard', icon: BarChart3 },
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
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left font-medium ${
                    isActive
                      ? 'bg-elevated text-accent-primary'
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
            {/* Mobile nav indicator */}
            <div className="flex items-center gap-2 md:hidden">
              <Cpu className="h-5 w-5 text-accent-primary" />
              <span className="font-bold text-sm">Hiresense</span>
            </div>
            <h1 className="text-xs font-medium text-muted hidden sm:block">
              Hiresense_AI — Competency Verification Engine
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-primary bg-elevated px-3 py-1.5 rounded-md border border-border">
                  <UserCheck className="h-3.5 w-3.5 text-state-success" />
                  <span className="font-medium">{user.displayName}</span>
                  <span className="text-muted capitalize">({user.role})</span>
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
          {activeView === 'roadmap' ? (
            <RoadmapView
              initialDomainSlug={roadmapTarget?.domainSlug}
              initialSkillId={roadmapTarget?.skillId}
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
          ) : activeView === 'dashboard' ? (
            <div className="space-y-6">
              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-primary">Hiresense_AI Workspace</h2>
                    <p className="text-sm text-muted mt-1">
                      Learn → Assess → Verify → Build Competency Profile → Analyze Career Gap → Practice Interview → Measure Readiness
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-accent-secondary" />
                </div>
              </div>

              {/* Quick Action: Open Roadmap */}
              <div className="bg-gradient-to-r from-elevated to-surface rounded-xl p-6 border border-accent-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-primary px-2 py-0.5 rounded bg-accent-primary/10 border border-accent-primary/20">
                    Phase 1 Active Feature
                  </span>
                  <h3 className="text-lg font-bold text-primary mt-2">Explore Normalized Learning Roadmaps</h3>
                  <p className="text-xs text-muted mt-1">
                    Browse prerequisite-aware skill graphs across Backend Developer, Frontend Developer, and AI & Data Engineer tracks.
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('roadmap')}
                  className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary/90 text-base font-semibold text-xs px-4 py-2 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Open Roadmap</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface rounded-lg p-5 border border-border">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Backend & Auth</h3>
                  <div className="font-mono text-sm">
                    {loading ? (
                      <span className="text-state-warning">Checking...</span>
                    ) : health ? (
                      <div className="space-y-1">
                        <p className="text-state-success font-medium">{health.name}</p>
                        <p className="text-xs text-muted">
                          Supabase Configured: {health.supabaseConfigured ? 'Yes' : 'Dev Mode'}
                        </p>
                      </div>
                    ) : (
                      <span className="text-state-error font-medium">Backend Offline</span>
                    )}
                  </div>
                </div>

                <div className="bg-surface rounded-lg p-5 border border-border">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Verification Invariant</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    Self-declared skills & resume claims remain <span className="text-state-warning font-mono">UNVERIFIED</span> until passing a backend assessment with <span className="text-accent-primary font-mono">&gt;= 80%</span>.
                  </p>
                </div>

                <div className="bg-surface rounded-lg p-5 border border-border">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">User Session</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {user ? (
                      <span className="text-state-success font-mono">Authenticated as {user.email}</span>
                    ) : (
                      <span className="text-muted font-mono">Unauthenticated (Click Sign In to authenticate)</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-surface rounded-2xl border border-border space-y-3">
              <h3 className="text-lg font-bold text-primary capitalize">{activeView} Module</h3>
              <p className="text-xs text-muted max-w-md mx-auto">
                This module is scheduled in subsequent build plan phases. Currently focusing on Phase 1 (Roadmap & Skill Progression).
              </p>
              <button
                onClick={() => setActiveView('roadmap')}
                className="inline-flex items-center gap-2 text-xs text-accent-primary font-medium hover:underline pt-2"
              >
                <BookOpen className="h-3.5 w-3.5" /> Go to Active Roadmap
              </button>
            </div>
          )}
        </div>
      </main>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}


import { useState } from 'react';
import { UserCompetencyScore, TIER_CONFIG } from './types';
import { Award, ShieldCheck, Zap, Layers, FolderGit2, MessageSquare, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface ScoreOverviewCardProps {
  score: UserCompetencyScore | null;
  loading?: boolean;
  onNavigateToRoadmap?: () => void;
  onNavigateToInterview?: () => void;
}

export function ScoreOverviewCard({
  score,
  loading = false,
  onNavigateToRoadmap,
  onNavigateToInterview,
}: ScoreOverviewCardProps) {
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  if (loading) {
    return (
      <div className="bg-surface rounded-2xl p-6 border border-border animate-pulse space-y-4">
        <div className="h-6 bg-elevated rounded w-1/3"></div>
        <div className="h-20 bg-elevated rounded"></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-elevated rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="bg-surface rounded-2xl p-6 border border-border text-center space-y-2">
        <p className="text-sm text-muted">Competency score data unavailable.</p>
      </div>
    );
  }

  const tier = score.tier || 'NOVICE';
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.NOVICE;
  const { components } = score;

  const componentMetrics = [
    {
      id: 'mastery',
      title: 'Skill Mastery',
      weight: '40%',
      rawScore: components.skillMastery.rawScore,
      weighted: components.skillMastery.weightedScore,
      icon: ShieldCheck,
      color: 'text-sky-400',
      barColor: 'bg-sky-400',
      subtitle: `${components.skillMastery.verifiedSkillsCount} verified skills (${components.skillMastery.averageScore}% avg)`,
    },
    {
      id: 'difficulty',
      title: 'Difficulty Factor',
      weight: '20%',
      rawScore: components.skillDifficulty.rawScore,
      weighted: components.skillDifficulty.weightedScore,
      icon: Zap,
      color: 'text-purple-400',
      barColor: 'bg-purple-400',
      subtitle: `${components.skillDifficulty.advancedCount} Adv, ${components.skillDifficulty.intermediateCount} Int, ${components.skillDifficulty.beginnerCount} Beg`,
    },
    {
      id: 'coverage',
      title: 'Domain Coverage',
      weight: '15%',
      rawScore: components.domainCoverage.rawScore,
      weighted: components.domainCoverage.weightedScore,
      icon: Layers,
      color: 'text-emerald-400',
      barColor: 'bg-emerald-400',
      subtitle: `${components.domainCoverage.verifiedInDomain}/${components.domainCoverage.totalInDomain} in ${components.domainCoverage.domainSlug}`,
    },
    {
      id: 'projects',
      title: 'Project Proofs',
      weight: '15%',
      rawScore: components.projectPerformance.rawScore,
      weighted: components.projectPerformance.weightedScore,
      icon: FolderGit2,
      color: 'text-amber-400',
      barColor: 'bg-amber-400',
      subtitle: `${components.projectPerformance.completedProjects} verified portfolio builds`,
    },
    {
      id: 'interview',
      title: 'Mock Interviews',
      weight: '10%',
      rawScore: components.interviewPerformance.rawScore,
      weighted: components.interviewPerformance.weightedScore,
      icon: MessageSquare,
      color: 'text-rose-400',
      barColor: 'bg-rose-400',
      subtitle: components.interviewPerformance.hasInterviewData
        ? `${components.interviewPerformance.sessionsCount} sessions (${components.interviewPerformance.averageInterviewScore}% avg)`
        : 'No interview data yet',
    },
  ];

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-lg shadow-black/20">
      {/* Top Banner: Composite Score & Tier */}
      <div className="p-6 bg-gradient-to-r from-elevated via-surface to-elevated border-b border-border/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-base/80 rounded-xl border border-border flex items-center justify-center shrink-0">
              <Award className={`h-8 w-8 ${tierConfig.textColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                  Deterministic Competency Score
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${tierConfig.badgeBg}`}
                >
                  {tierConfig.label.toUpperCase()} TIER
                </span>
              </div>
              <h2 className="text-2xl font-black text-primary tracking-tight mt-1 flex items-baseline gap-2">
                <span>{score.compositeScore}</span>
                <span className="text-sm font-normal text-muted">/ 100</span>
              </h2>
              <p className="text-xs text-muted mt-1 max-w-xl">{tierConfig.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            {onNavigateToRoadmap && (
              <button
                onClick={onNavigateToRoadmap}
                className="text-xs font-semibold text-accent-primary hover:text-white px-3 py-1.5 rounded-lg bg-accent-primary/10 hover:bg-accent-primary/20 border border-accent-primary/30 transition-colors"
              >
                Verify More Skills
              </button>
            )}
            {onNavigateToInterview && (
              <button
                onClick={onNavigateToInterview}
                className="text-xs font-semibold text-accent-secondary hover:text-white px-3 py-1.5 rounded-lg bg-accent-secondary/10 hover:bg-accent-secondary/20 border border-accent-secondary/30 transition-colors"
              >
                Practice Interview
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5-Component Breakdown Grid */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            5-Factor Competency Component Weights
          </h3>
          <button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
          >
            <Info className="h-3.5 w-3.5" />
            <span>{detailsExpanded ? 'Hide' : 'Explain'} Formula</span>
            {detailsExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {componentMetrics.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.id}
                className="bg-elevated/70 hover:bg-elevated border border-border/80 hover:border-border rounded-xl p-3.5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 ${c.color}`} />
                      <span className="font-semibold text-primary text-xs">{c.title}</span>
                    </div>
                    <span className="font-mono text-[11px] text-muted">{c.weight}</span>
                  </div>

                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-lg font-bold font-mono text-primary">
                      {c.rawScore}
                      <span className="text-xs text-muted font-normal">/100</span>
                    </span>
                    <span className="text-xs font-mono text-accent-primary">+{c.weighted} pts</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-base/80 rounded-full h-1.5 mb-2 overflow-hidden border border-border/40">
                    <div
                      className={`h-full rounded-full ${c.barColor} transition-all duration-500`}
                      style={{ width: `${Math.min(c.rawScore, 100)}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-muted leading-tight truncate" title={c.subtitle}>
                  {c.subtitle}
                </p>
              </div>
            );
          })}
        </div>

        {/* Expandable Mathematical Transparency Drawer */}
        {detailsExpanded && (
          <div className="mt-4 p-4 rounded-xl bg-base border border-border/80 text-xs text-muted space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Info className="h-4 w-4 text-accent-primary" />
              <span>Deterministic Hiresense Scoring Standard</span>
            </div>
            <p className="leading-relaxed">
              Scores on Hiresense are 100% computed server-side and impossible to inflate via self-declaration or unverified claims.
              Every score combines:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-elevated/60 border border-border/40">
                <span className="text-sky-400 font-bold">1. Skill Mastery (40%)</span>: Verified assessment scores (≥ 80%) with attempt decay.
              </div>
              <div className="p-2 rounded bg-elevated/60 border border-border/40">
                <span className="text-purple-400 font-bold">2. Skill Difficulty (20%)</span>: Multipliers (1.0× Beg, 1.5× Int, 2.0× Adv).
              </div>
              <div className="p-2 rounded bg-elevated/60 border border-border/40">
                <span className="text-emerald-400 font-bold">3. Domain Coverage (15%)</span>: Percentage completion of track curriculum.
              </div>
              <div className="p-2 rounded bg-elevated/60 border border-border/40">
                <span className="text-amber-400 font-bold">4. Project Performance (15%)</span>: Verified capstone builds & code artifacts.
              </div>
              <div className="p-2 rounded bg-elevated/60 border border-border/40 md:col-span-2">
                <span className="text-rose-400 font-bold">5. Mock Interview Readiness (10%)</span>: STAR response quality and communication clarity.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

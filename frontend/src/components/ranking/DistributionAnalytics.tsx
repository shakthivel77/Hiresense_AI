import { ScoreDistribution } from './types';
import { BarChart3, Users, Award, Building2, BookOpen, TrendingUp } from 'lucide-react';

interface DistributionAnalyticsProps {
  distribution: ScoreDistribution | null;
  loading?: boolean;
}

export function DistributionAnalytics({ distribution, loading = false }: DistributionAnalyticsProps) {
  if (loading) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-elevated rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-elevated rounded-xl"></div>
          <div className="h-24 bg-elevated rounded-xl"></div>
          <div className="h-24 bg-elevated rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!distribution) return null;

  const { totalScoredCandidates, averageGlobalScore, tierDistribution, topInstitutions, topDomains } = distribution;

  const tiers: Array<{ key: keyof typeof tierDistribution; label: string; minScore: string; color: string; barBg: string }> = [
    { key: 'MASTER', label: 'Master', minScore: '90+', color: 'text-purple-400', barBg: 'bg-purple-500' },
    { key: 'EXPERT', label: 'Expert', minScore: '75–89', color: 'text-sky-400', barBg: 'bg-sky-500' },
    { key: 'PROFICIENT', label: 'Proficient', minScore: '60–74', color: 'text-emerald-400', barBg: 'bg-emerald-500' },
    { key: 'APPRENTICE', label: 'Apprentice', minScore: '40–59', color: 'text-amber-400', barBg: 'bg-amber-500' },
    { key: 'NOVICE', label: 'Novice', minScore: '<40', color: 'text-slate-400', barBg: 'bg-slate-600' },
  ];

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="h-5 w-5 text-accent-primary" />
          <h3 className="text-sm font-bold text-primary">Global Competency Distribution & Benchmarks</h3>
        </div>
        <span className="text-xs font-mono text-muted">
          Based on verified assessments across all institutions
        </span>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-elevated/60 border border-border/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted font-semibold uppercase tracking-wider">Total Scored</span>
            <div className="text-2xl font-black text-primary font-mono mt-0.5">{totalScoredCandidates}</div>
            <span className="text-[11px] text-muted">active candidates</span>
          </div>
          <div className="p-3 bg-base rounded-xl border border-border">
            <Users className="h-6 w-6 text-accent-primary" />
          </div>
        </div>

        <div className="bg-elevated/60 border border-border/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted font-semibold uppercase tracking-wider">Global Average</span>
            <div className="text-2xl font-black text-primary font-mono mt-0.5">
              {averageGlobalScore}
              <span className="text-xs text-muted font-normal"> / 100</span>
            </div>
            <span className="text-[11px] text-state-success">standard benchmark</span>
          </div>
          <div className="p-3 bg-base rounded-xl border border-border">
            <TrendingUp className="h-6 w-6 text-state-success" />
          </div>
        </div>

        <div className="bg-elevated/60 border border-border/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted font-semibold uppercase tracking-wider">Elite Tier Ratio</span>
            <div className="text-2xl font-black text-purple-400 font-mono mt-0.5">
              {totalScoredCandidates > 0
                ? Math.round(
                    (((tierDistribution.MASTER || 0) + (tierDistribution.EXPERT || 0)) / totalScoredCandidates) * 100
                  )
                : 0}
              %
            </div>
            <span className="text-[11px] text-muted">Master & Expert level</span>
          </div>
          <div className="p-3 bg-base rounded-xl border border-border">
            <Award className="h-6 w-6 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Tier Distribution Bars */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Competency Tier Population Breakdown
        </h4>
        <div className="space-y-2">
          {tiers.map((t) => {
            const count = tierDistribution[t.key] || 0;
            const percentage =
              totalScoredCandidates > 0 ? Math.round((count / totalScoredCandidates) * 100) : 0;

            return (
              <div key={t.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${t.color}`}>{t.label}</span>
                    <span className="text-[11px] text-muted">({t.minScore})</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted text-[11px]">
                    <span className="text-primary font-bold">{count}</span> candidate{count === 1 ? '' : 's'}
                    <span>·</span>
                    <span>{percentage}%</span>
                  </div>
                </div>

                <div className="w-full bg-base rounded-full h-2 overflow-hidden border border-border/40">
                  <div
                    className={`h-full ${t.barBg} transition-all duration-500 rounded-full`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Institutional & Domain Benchmarks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Top Institutions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <Building2 className="h-3.5 w-3.5 text-accent-primary" />
            <span>Top Performing Institutions</span>
          </div>

          <div className="space-y-2">
            {topInstitutions.slice(0, 4).map((inst, index) => (
              <div
                key={inst.institution}
                className="bg-elevated/40 border border-border/60 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-muted font-bold w-4">#{index + 1}</span>
                  <span className="font-semibold text-primary truncate">{inst.institution}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-right shrink-0">
                  <span className="text-muted text-[11px]">{inst.candidateCount} cand.</span>
                  <span className="font-bold text-accent-primary">{inst.averageScore} avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Domains */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <BookOpen className="h-3.5 w-3.5 text-accent-secondary" />
            <span>Track Competency Averages</span>
          </div>

          <div className="space-y-2">
            {topDomains.map((domain) => (
              <div
                key={domain.domainSlug}
                className="bg-elevated/40 border border-border/60 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-primary block truncate">{domain.domainName}</span>
                  <span className="text-[11px] text-muted font-mono">{domain.candidateCount} evaluated</span>
                </div>
                <div className="font-mono text-right shrink-0">
                  <div className="font-bold text-accent-secondary">{domain.averageScore}</div>
                  <span className="text-[10px] text-muted">track avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

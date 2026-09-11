import { useEffect, useState } from 'react';
import { LeaderboardEntry, UserCompetencyScore, TIER_CONFIG } from './types';
import { fetchUserCompetencyScore } from '../../lib/rankingApi';
import { X, Award, ShieldCheck, Zap, Layers, FolderGit2, MessageSquare, Building2, CheckCircle2 } from 'lucide-react';

interface CandidateScoreModalProps {
  candidate: LeaderboardEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CandidateScoreModal({ candidate, isOpen, onClose }: CandidateScoreModalProps) {
  const [scoreData, setScoreData] = useState<UserCompetencyScore | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !candidate) {
      setScoreData(null);
      return;
    }

    setLoading(true);
    fetchUserCompetencyScore(candidate.userId)
      .then((data) => {
        setScoreData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load candidate score', err);
        setLoading(false);
      });
  }, [isOpen, candidate]);

  if (!isOpen || !candidate) return null;

  const tier = candidate.tier || 'NOVICE';
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.NOVICE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-surface rounded-2xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-border/80 flex items-start justify-between bg-elevated/50">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center font-bold text-accent-primary text-lg">
              {candidate.displayName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-primary">{candidate.displayName}</h3>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${tierConfig.badgeBg}`}
                >
                  {tierConfig.label.toUpperCase()} TIER
                </span>
                <span className="text-xs text-muted font-mono capitalize">({candidate.role})</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted mt-1">
                {candidate.institution && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-muted" />
                    {candidate.institution}
                  </span>
                )}
                {candidate.primaryDomain && (
                  <span className="font-mono text-accent-primary">
                    {candidate.primaryDomain.replace('-', ' ').toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-muted hover:text-primary p-1 rounded-lg hover:bg-elevated transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Main Score Banner */}
          <div className="bg-base rounded-xl p-5 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className={`h-8 w-8 ${tierConfig.textColor}`} />
              <div>
                <span className="text-xs text-muted font-mono uppercase tracking-wider">
                  Verified Composite Score
                </span>
                <div className="text-3xl font-black text-primary font-mono">
                  {candidate.compositeScore}
                  <span className="text-sm font-normal text-muted"> / 100</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted">Global Ranking</span>
              <div className="text-2xl font-black text-accent-primary font-mono">#{candidate.rank}</div>
            </div>
          </div>

          {/* 5 Component Breakdown */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
              Deterministic Breakdown
            </h4>

            {loading ? (
              <div className="space-y-2 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-elevated rounded-lg"></div>
                ))}
              </div>
            ) : scoreData ? (
              <div className="space-y-2.5">
                {/* 1. Skill Mastery */}
                <div className="bg-elevated/60 border border-border/80 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-sky-400" />
                    <div>
                      <div className="text-xs font-bold text-primary">Skill Mastery (40% weight)</div>
                      <div className="text-[11px] text-muted">
                        {scoreData.components.skillMastery.verifiedSkillsCount} verified skills · {scoreData.components.skillMastery.averageScore}% avg score
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-primary">{scoreData.components.skillMastery.rawScore}/100</div>
                    <div className="text-[11px] text-sky-400">+{scoreData.components.skillMastery.weightedScore} pts</div>
                  </div>
                </div>

                {/* 2. Skill Difficulty */}
                <div className="bg-elevated/60 border border-border/80 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-bold text-primary">Skill Difficulty Multiplier (20% weight)</div>
                      <div className="text-[11px] text-muted">
                        {scoreData.components.skillDifficulty.advancedCount} Adv (2.0×) · {scoreData.components.skillDifficulty.intermediateCount} Int (1.5×) · {scoreData.components.skillDifficulty.beginnerCount} Beg (1.0×)
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-primary">{scoreData.components.skillDifficulty.rawScore}/100</div>
                    <div className="text-[11px] text-purple-400">+{scoreData.components.skillDifficulty.weightedScore} pts</div>
                  </div>
                </div>

                {/* 3. Domain Coverage */}
                <div className="bg-elevated/60 border border-border/80 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Layers className="h-4 w-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-primary">Domain Curriculum Coverage (15% weight)</div>
                      <div className="text-[11px] text-muted">
                        {scoreData.components.domainCoverage.verifiedInDomain} of {scoreData.components.domainCoverage.totalInDomain} skills verified in {scoreData.components.domainCoverage.domainSlug}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-primary">{scoreData.components.domainCoverage.rawScore}/100</div>
                    <div className="text-[11px] text-emerald-400">+{scoreData.components.domainCoverage.weightedScore} pts</div>
                  </div>
                </div>

                {/* 4. Project Performance */}
                <div className="bg-elevated/60 border border-border/80 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FolderGit2 className="h-4 w-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-bold text-primary">Project Portfolio Proofs (15% weight)</div>
                      <div className="text-[11px] text-muted">
                        {scoreData.components.projectPerformance.completedProjects} verified portfolio builds
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-primary">{scoreData.components.projectPerformance.rawScore}/100</div>
                    <div className="text-[11px] text-amber-400">+{scoreData.components.projectPerformance.weightedScore} pts</div>
                  </div>
                </div>

                {/* 5. Mock Interview */}
                <div className="bg-elevated/60 border border-border/80 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-rose-400" />
                    <div>
                      <div className="text-xs font-bold text-primary">Mock Interview Evaluation (10% weight)</div>
                      <div className="text-[11px] text-muted">
                        {scoreData.components.interviewPerformance.hasInterviewData
                          ? `${scoreData.components.interviewPerformance.sessionsCount} session(s) evaluated (${scoreData.components.interviewPerformance.averageInterviewScore}% avg)`
                          : 'No interview data recorded'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-primary">{scoreData.components.interviewPerformance.rawScore}/100</div>
                    <div className="text-[11px] text-rose-400">+{scoreData.components.interviewPerformance.weightedScore} pts</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-elevated/40 rounded-xl text-center text-xs text-muted">
                Score breakdown details could not be loaded.
              </div>
            )}
          </div>

          {/* Authenticity Guarantee */}
          <div className="p-3.5 rounded-xl bg-base border border-state-success/30 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-state-success shrink-0" />
            <div className="text-xs text-muted">
              <span className="font-semibold text-primary">Verified Hiresense Proof</span>: All underlying assessments were passed with <span className="text-state-success font-mono font-bold">≥ 80%</span> accuracy under authenticated proctoring limits.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-elevated/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-base hover:bg-elevated border border-border text-xs font-semibold text-primary rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

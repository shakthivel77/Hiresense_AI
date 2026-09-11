import { LeaderboardEntry, TIER_CONFIG } from './types';
import { ShieldCheck, Building2, Trophy, ChevronRight, MessageSquare, FolderGit2 } from 'lucide-react';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string | null;
  loading?: boolean;
  onSelectCandidate: (candidate: LeaderboardEntry) => void;
}

export function LeaderboardTable({
  entries,
  currentUserId,
  loading = false,
  onSelectCandidate,
}: LeaderboardTableProps) {
  if (loading) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-elevated rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-12 text-center space-y-3">
        <Trophy className="h-10 w-10 text-muted mx-auto opacity-50" />
        <h3 className="text-base font-bold text-primary">No Candidates Found</h3>
        <p className="text-xs text-muted max-w-sm mx-auto">
          No candidates matched your filter criteria or search query. Try adjusting your scope or filters.
        </p>
      </div>
    );
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="h-8 w-8 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-base font-black flex items-center justify-center text-xs shadow-md shadow-amber-500/20 border border-amber-200 shrink-0">
          🥇
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="h-8 w-8 rounded-full bg-gradient-to-b from-slate-200 to-slate-400 text-base font-black flex items-center justify-center text-xs shadow-md shadow-slate-400/20 border border-slate-100 shrink-0">
          🥈
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="h-8 w-8 rounded-full bg-gradient-to-b from-amber-600 to-amber-800 text-white font-black flex items-center justify-center text-xs shadow-md shadow-amber-800/20 border border-amber-500 shrink-0">
          🥉
        </div>
      );
    }
    return (
      <div className="h-8 w-8 rounded-full bg-base border border-border text-muted font-mono font-bold flex items-center justify-center text-xs shrink-0">
        #{rank}
      </div>
    );
  };

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-lg shadow-black/20">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-elevated/80 border-b border-border text-[11px] font-mono uppercase tracking-wider text-muted">
              <th className="py-3 px-4 w-16 text-center">Rank</th>
              <th className="py-3 px-4">Candidate</th>
              <th className="py-3 px-4 hidden md:table-cell">Institution</th>
              <th className="py-3 px-4 hidden lg:table-cell">Primary Domain</th>
              <th className="py-3 px-4 text-center">Tier</th>
              <th className="py-3 px-4 text-center hidden sm:table-cell">Verifications</th>
              <th className="py-3 px-4 text-right">Score</th>
              <th className="py-3 px-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {entries.map((entry) => {
              const isCurrentUser = currentUserId && entry.userId === currentUserId;
              const tierConfig = TIER_CONFIG[entry.tier] || TIER_CONFIG.NOVICE;

              return (
                <tr
                  key={entry.userId}
                  onClick={() => onSelectCandidate(entry)}
                  className={`cursor-pointer transition-all hover:bg-elevated/70 group ${
                    isCurrentUser ? 'bg-accent-primary/5 border-l-4 border-l-accent-primary' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex justify-center">{getRankBadge(entry.rank)}</div>
                  </td>

                  {/* Candidate Profile */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-elevated border border-border flex items-center justify-center font-bold text-accent-primary text-xs shrink-0 group-hover:border-accent-primary/50 transition-colors">
                        {entry.displayName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary truncate">{entry.displayName}</span>
                          {isCurrentUser && (
                            <span className="text-[10px] font-mono font-bold bg-accent-primary/20 text-accent-primary px-1.5 py-0.2 rounded">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                          <span className="capitalize">{entry.role}</span>
                          <span className="md:hidden truncate">· {entry.institution}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Institution */}
                  <td className="py-3.5 px-4 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-muted">
                      <Building2 className="h-3.5 w-3.5 text-muted/70 shrink-0" />
                      <span className="truncate max-w-[180px]">{entry.institution || 'Independent'}</span>
                    </div>
                  </td>

                  {/* Primary Domain */}
                  <td className="py-3.5 px-4 hidden lg:table-cell">
                    {entry.primaryDomain ? (
                      <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-mono bg-base border border-border/80 text-muted">
                        {entry.primaryDomain.replace('-', ' ')}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>

                  {/* Tier Badge */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${tierConfig.badgeBg}`}
                    >
                      {tierConfig.label}
                    </span>
                  </td>

                  {/* Verified Skills & Interviews */}
                  <td className="py-3.5 px-4 text-center hidden sm:table-cell">
                    <div className="flex items-center justify-center gap-3 text-muted font-mono text-[11px]">
                      <span className="flex items-center gap-1 text-sky-400 font-semibold" title="Verified Skills">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {entry.verifiedSkillsCount}
                      </span>
                      {entry.completedProjectsCount > 0 && (
                        <span className="flex items-center gap-1 text-amber-400" title="Completed Projects">
                          <FolderGit2 className="h-3.5 w-3.5" />
                          {entry.completedProjectsCount}
                        </span>
                      )}
                      {entry.completedInterviewsCount > 0 && (
                        <span className="flex items-center gap-1 text-rose-400" title="Mock Interviews">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {entry.completedInterviewsCount}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Score */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-sm font-bold text-primary">{entry.compositeScore}</span>
                      <span className="text-[10px] text-muted">/100</span>
                    </div>
                    {/* Small progress meter */}
                    <div className="w-20 ml-auto bg-base rounded-full h-1 mt-1 overflow-hidden">
                      <div
                        className="h-full bg-accent-primary rounded-full"
                        style={{ width: `${entry.compositeScore}%` }}
                      />
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-center text-muted group-hover:text-accent-primary transition-colors">
                    <ChevronRight className="h-4 w-4 inline" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

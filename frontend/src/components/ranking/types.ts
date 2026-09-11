export type {
  CompetencyTier,
  ComponentMetric,
  ScoreComponentBreakdown,
  UserCompetencyScore,
  LeaderboardEntry,
  LeaderboardResponse,
  ScoreDistribution,
} from '../../lib/rankingApi';

export type RankingScopeTab = 'global' | 'domain' | 'institution';

export interface TierStyleConfig {
  label: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  glowColor: string;
  description: string;
}

export const TIER_CONFIG: Record<string, TierStyleConfig> = {
  MASTER: {
    label: 'Master',
    badgeBg: 'bg-purple-950/40 text-purple-300 border-purple-500/40',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/50',
    glowColor: 'shadow-purple-500/20',
    description: 'Score 90–100 · Elite architectural mastery & proven interview delivery',
  },
  EXPERT: {
    label: 'Expert',
    badgeBg: 'bg-sky-950/40 text-sky-300 border-sky-500/40',
    textColor: 'text-sky-400',
    borderColor: 'border-sky-500/50',
    glowColor: 'shadow-sky-500/20',
    description: 'Score 75–89 · High domain depth & multi-skill verifications',
  },
  PROFICIENT: {
    label: 'Proficient',
    badgeBg: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/50',
    glowColor: 'shadow-emerald-500/20',
    description: 'Score 60–74 · Solid core competence across prerequisite pathways',
  },
  APPRENTICE: {
    label: 'Apprentice',
    badgeBg: 'bg-amber-950/40 text-amber-300 border-amber-500/40',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/50',
    glowColor: 'shadow-amber-500/20',
    description: 'Score 40–59 · Actively building foundational verified skills',
  },
  NOVICE: {
    label: 'Novice',
    badgeBg: 'bg-slate-900/60 text-slate-400 border-slate-700/50',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-700',
    glowColor: 'shadow-slate-500/10',
    description: 'Score 0–39 · Early stage learner starting assessments',
  },
};

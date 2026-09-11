import { Globe, BookOpen, Building2, Search, X } from 'lucide-react';
import { RankingScopeTab, CompetencyTier } from './types';

interface LeaderboardFiltersProps {
  activeScope: RankingScopeTab;
  onScopeChange: (scope: RankingScopeTab) => void;
  domainSlug?: string;
  onDomainChange: (domain: string) => void;
  institution?: string;
  onInstitutionChange: (inst: string) => void;
  selectedTier?: CompetencyTier | 'ALL';
  onTierChange: (tier: CompetencyTier | 'ALL') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalEntries: number;
}

const DOMAIN_OPTIONS = [
  { slug: '', label: 'All Domains' },
  { slug: 'backend-developer', label: 'Backend Developer' },
  { slug: 'frontend-developer', label: 'Frontend Developer' },
  { slug: 'ai-data-engineer', label: 'AI & Data Engineer' },
];

const TIER_OPTIONS: Array<{ id: CompetencyTier | 'ALL'; label: string; color: string }> = [
  { id: 'ALL', label: 'All Tiers', color: 'text-primary' },
  { id: 'MASTER', label: 'Master (90+)', color: 'text-purple-400' },
  { id: 'EXPERT', label: 'Expert (75–89)', color: 'text-sky-400' },
  { id: 'PROFICIENT', label: 'Proficient (60–74)', color: 'text-emerald-400' },
  { id: 'APPRENTICE', label: 'Apprentice (40–59)', color: 'text-amber-400' },
  { id: 'NOVICE', label: 'Novice (<40)', color: 'text-slate-400' },
];

export function LeaderboardFilters({
  activeScope,
  onScopeChange,
  domainSlug = '',
  onDomainChange,
  institution = '',
  onInstitutionChange,
  selectedTier = 'ALL',
  onTierChange,
  searchQuery,
  onSearchChange,
  totalEntries,
}: LeaderboardFiltersProps) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 space-y-4">
      {/* Top Scope Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-1 bg-base p-1 rounded-xl border border-border/80 self-start">
          <button
            onClick={() => onScopeChange('global')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeScope === 'global'
                ? 'bg-elevated text-accent-primary shadow-sm'
                : 'text-muted hover:text-primary'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Global All-Stars</span>
          </button>

          <button
            onClick={() => onScopeChange('domain')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeScope === 'domain'
                ? 'bg-elevated text-accent-primary shadow-sm'
                : 'text-muted hover:text-primary'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Track Leaderboards</span>
          </button>

          <button
            onClick={() => onScopeChange('institution')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeScope === 'institution'
                ? 'bg-elevated text-accent-primary shadow-sm'
                : 'text-muted hover:text-primary'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Institutions</span>
          </button>
        </div>

        <div className="text-xs text-muted font-mono self-end sm:self-auto">
          Showing <span className="text-primary font-bold">{totalEntries}</span> evaluated candidate{totalEntries === 1 ? '' : 's'}
        </div>
      </div>

      {/* Scope-specific controls & Global Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Secondary Scope Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeScope === 'domain' && (
            <select
              value={domainSlug}
              onChange={(e) => onDomainChange(e.target.value)}
              className="bg-elevated text-xs font-semibold text-primary px-3 py-2 rounded-lg border border-border focus:border-accent-primary focus:outline-none transition-colors"
            >
              {DOMAIN_OPTIONS.map((opt) => (
                <option key={opt.slug} value={opt.slug} className="bg-surface">
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {activeScope === 'institution' && (
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by university / institute..."
                value={institution}
                onChange={(e) => onInstitutionChange(e.target.value)}
                className="bg-elevated text-xs text-primary placeholder-muted/70 pl-8 pr-3 py-2 rounded-lg border border-border focus:border-accent-primary focus:outline-none w-64"
              />
              <Building2 className="h-3.5 w-3.5 text-muted absolute left-2.5 top-2.5" />
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search candidate by name, institution, or domain..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-base text-xs text-primary placeholder-muted/60 pl-9 pr-8 py-2 rounded-lg border border-border focus:border-accent-primary focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-muted hover:text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tier Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
        <span className="text-[11px] font-semibold text-muted mr-1 shrink-0">Tier:</span>
        {TIER_OPTIONS.map((tier) => {
          const isSelected = selectedTier === tier.id;
          return (
            <button
              key={tier.id}
              onClick={() => onTierChange(tier.id)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-elevated border-accent-primary text-accent-primary font-semibold shadow-sm'
                  : 'bg-base/60 border-border/60 text-muted hover:text-primary hover:bg-elevated/40'
              }`}
            >
              <span className={isSelected ? 'text-accent-primary' : tier.color}>●</span> {tier.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

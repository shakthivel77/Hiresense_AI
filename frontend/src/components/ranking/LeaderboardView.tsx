import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchMyCompetencyScore,
  fetchLeaderboard,
  fetchScoreDistribution,
} from '../../lib/rankingApi';
import {
  UserCompetencyScore,
  LeaderboardEntry,
  ScoreDistribution,
  RankingScopeTab,
  CompetencyTier,
} from './types';
import { ScoreOverviewCard } from './ScoreOverviewCard';
import { LeaderboardFilters } from './LeaderboardFilters';
import { LeaderboardTable } from './LeaderboardTable';
import { DistributionAnalytics } from './DistributionAnalytics';
import { CandidateScoreModal } from './CandidateScoreModal';
import { Trophy, BarChart3, RefreshCw } from 'lucide-react';

interface LeaderboardViewProps {
  onNavigateToRoadmap?: () => void;
  onNavigateToInterview?: () => void;
}

export function LeaderboardView({
  onNavigateToRoadmap,
  onNavigateToInterview,
}: LeaderboardViewProps) {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'analytics'>('leaderboard');

  // Personal Competency Score
  const [userScore, setUserScore] = useState<UserCompetencyScore | null>(null);
  const [loadingScore, setLoadingScore] = useState(true);

  // Leaderboard data & filters
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  const [activeScope, setActiveScope] = useState<RankingScopeTab>('global');
  const [domainSlug, setDomainSlug] = useState<string>('');
  const [institution, setInstitution] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<CompetencyTier | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Distribution analytics data
  const [distribution, setDistribution] = useState<ScoreDistribution | null>(null);
  const [loadingDistribution, setLoadingDistribution] = useState(true);

  // Inspection modal
  const [inspectCandidate, setInspectCandidate] = useState<LeaderboardEntry | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 1. Fetch current user score
  const loadUserScore = useCallback(async () => {
    setLoadingScore(true);
    try {
      const data = await fetchMyCompetencyScore(token);
      setUserScore(data);
    } catch (err) {
      console.warn('Could not load user score', err);
    } finally {
      setLoadingScore(false);
    }
  }, [token]);

  // 2. Fetch leaderboard entries
  const loadLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const data = await fetchLeaderboard(
        {
          scope: activeScope,
          domainSlug: activeScope === 'domain' && domainSlug ? domainSlug : undefined,
          institution: activeScope === 'institution' && institution ? institution : undefined,
          tier: selectedTier !== 'ALL' ? selectedTier : undefined,
          search: searchQuery.trim() || undefined,
        },
        token
      );
      setEntries(data.entries);
      setTotalEntries(data.totalEntries);
    } catch (err) {
      console.error('Failed to load leaderboard', err);
      setEntries([]);
      setTotalEntries(0);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [activeScope, domainSlug, institution, selectedTier, searchQuery, token]);

  // 3. Fetch distribution
  const loadDistribution = useCallback(async () => {
    setLoadingDistribution(true);
    try {
      const data = await fetchScoreDistribution();
      setDistribution(data);
    } catch (err) {
      console.error('Failed to load score distribution', err);
    } finally {
      setLoadingDistribution(false);
    }
  }, []);

  useEffect(() => {
    loadUserScore();
    loadDistribution();
  }, [loadUserScore, loadDistribution]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const handleSelectCandidate = (candidate: LeaderboardEntry) => {
    setInspectCandidate(candidate);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-primary tracking-tight">
              Competency Rankings & Leaderboard
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-primary px-2 py-0.5 rounded bg-accent-primary/10 border border-accent-primary/20">
              Deterministic 5-Factor
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Verifiable merit-based ranking calculated from assessment mastery, difficulty multipliers, curriculum coverage, project proofs, and mock interviews.
          </p>
        </div>

        {/* View Switcher Tabs & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-elevated text-accent-primary shadow-sm'
                  : 'text-muted hover:text-primary'
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Leaderboard</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-elevated text-accent-primary shadow-sm'
                  : 'text-muted hover:text-primary'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Distribution</span>
            </button>
          </div>

          <button
            onClick={() => {
              loadUserScore();
              loadLeaderboard();
              loadDistribution();
            }}
            title="Refresh rankings"
            className="p-2 rounded-xl bg-surface border border-border text-muted hover:text-primary hover:bg-elevated transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Candidate Personal Competency HUD */}
      <ScoreOverviewCard
        score={userScore}
        loading={loadingScore}
        onNavigateToRoadmap={onNavigateToRoadmap}
        onNavigateToInterview={onNavigateToInterview}
      />

      {/* Main Tab Content */}
      {activeTab === 'leaderboard' ? (
        <div className="space-y-4">
          <LeaderboardFilters
            activeScope={activeScope}
            onScopeChange={setActiveScope}
            domainSlug={domainSlug}
            onDomainChange={setDomainSlug}
            institution={institution}
            onInstitutionChange={setInstitution}
            selectedTier={selectedTier}
            onTierChange={setSelectedTier}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalEntries={totalEntries}
          />

          <LeaderboardTable
            entries={entries}
            currentUserId={user?.id}
            loading={loadingLeaderboard}
            onSelectCandidate={handleSelectCandidate}
          />
        </div>
      ) : (
        <DistributionAnalytics
          distribution={distribution}
          loading={loadingDistribution}
        />
      )}

      {/* Candidate Score Modal */}
      <CandidateScoreModal
        candidate={inspectCandidate}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setInspectCandidate(null);
        }}
      />
    </div>
  );
}

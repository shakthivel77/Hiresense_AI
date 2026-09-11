import { RankingService } from './rankingService.js';
import { ScoreEngine } from './scoreEngine.js';

function runUnit44Verification() {
  console.log('--- STARTING UNIT 44 VERIFICATION ---');
  const rankingService = new RankingService();

  // 1. Verify Seed Benchmark Scoring
  console.log('1. Verifying Benchmark Profiles and Scores...');
  const cand1Score = rankingService.getCandidateScore('cand-001');
  console.log(`Cand-001 (Priya Sharma) score: ${cand1Score.compositeScore}, tier: ${cand1Score.tier}`);
  if (cand1Score.compositeScore <= 0 || !cand1Score.tier) {
    throw new Error('Candidate 1 score calculation invalid');
  }

  // 2. Verify Global Leaderboard Query & Deterministic Sorting
  console.log('2. Verifying Global Leaderboard...');
  const globalBoard = rankingService.getLeaderboard({ scope: 'global' });
  console.log(`Total entries: ${globalBoard.totalEntries}`);
  if (globalBoard.entries.length === 0) {
    throw new Error('Leaderboard should return seeded entries');
  }
  
  // Verify descending score order
  for (let i = 0; i < globalBoard.entries.length - 1; i++) {
    const curr = globalBoard.entries[i];
    const next = globalBoard.entries[i + 1];
    if (curr.compositeScore < next.compositeScore) {
      throw new Error(`Leaderboard sorting failed at index ${i}: ${curr.compositeScore} < ${next.compositeScore}`);
    }
  }
  console.log('Global leaderboard is correctly sorted descending.');

  // 3. Verify Domain Filter
  console.log('3. Verifying Domain Filter (backend-developer)...');
  const backendBoard = rankingService.getLeaderboard({ domainSlug: 'backend-developer' });
  for (const entry of backendBoard.entries) {
    if (entry.primaryDomain !== 'backend-developer') {
      throw new Error(`Domain filter leaked domain: ${entry.primaryDomain}`);
    }
  }
  console.log(`Backend developer entries found: ${backendBoard.entries.length}`);

  // 4. Verify Institution Filter
  console.log('4. Verifying Institution Filter (Stanford)...');
  const stanfordBoard = rankingService.getLeaderboard({ institution: 'Stanford' });
  for (const entry of stanfordBoard.entries) {
    if (!entry.institution?.toLowerCase().includes('stanford')) {
      throw new Error(`Institution filter leaked institution: ${entry.institution}`);
    }
  }
  console.log(`Stanford entries found: ${stanfordBoard.entries.length}`);

  // 5. Verify Tier Filter
  console.log('5. Verifying Tier Filter (EXPERT)...');
  const expertBoard = rankingService.getLeaderboard({ tier: 'EXPERT' });
  for (const entry of expertBoard.entries) {
    if (entry.tier !== 'EXPERT') {
      throw new Error(`Tier filter leaked tier: ${entry.tier}`);
    }
  }
  console.log(`Expert tier entries found: ${expertBoard.entries.length}`);

  // 6. Verify Score Distribution Aggregate
  console.log('6. Verifying Score Distribution Analytics...');
  const distribution = rankingService.getScoreDistribution();
  console.log(`Total scored: ${distribution.totalScoredCandidates}, Avg Global: ${distribution.averageGlobalScore}`);
  console.log('Tier distribution:', distribution.tierDistribution);
  console.log('Top institutions:', distribution.topInstitutions);
  if (distribution.totalScoredCandidates !== 6) {
    throw new Error(`Expected 6 seeded candidates, got ${distribution.totalScoredCandidates}`);
  }

  // 7. Verify Candidate Registration and Dynamic Rank Update
  console.log('7. Verifying Dynamic Candidate Update...');
  rankingService.registerOrUpdateCandidate(
    'live-cand-100',
    'Jane Doe',
    'student',
    'MIT',
    'backend-developer',
    {
      userId: 'live-cand-100',
      verifiedSkills: [
        { skillId: 's1', skillName: 'Node.js', category: 'Backend', difficulty: 'advanced', verificationScore: 98 },
        { skillId: 's2', skillName: 'Postgres', category: 'Databases', difficulty: 'advanced', verificationScore: 99 },
        { skillId: 's3', skillName: 'Redis', category: 'Databases', difficulty: 'advanced', verificationScore: 95 },
        { skillId: 's4', skillName: 'Security', category: 'Security', difficulty: 'advanced', verificationScore: 97 },
      ],
      completedProjectsCount: 4,
      interviewSessions: [{ sessionId: 'i-1', overallScore: 96 }],
      domainCoverage: { domainSlug: 'backend-developer', domainName: 'Backend Developer', totalSkillsCount: 5, verifiedSkillsCount: 4 }
    }
  );

  const updatedBoard = rankingService.getLeaderboard({ scope: 'global' }, 'live-cand-100');
  if (updatedBoard.userRank?.userId !== 'live-cand-100') {
    throw new Error('Dynamic user rank retrieval failed');
  }
  console.log(`Dynamic candidate rank: #${updatedBoard.userRank.rank}, score: ${updatedBoard.userRank.compositeScore}`);

  console.log('--- ALL UNIT 44 VERIFICATIONS PASSED ---');
}

runUnit44Verification();

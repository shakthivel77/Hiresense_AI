import express from 'express';
import http from 'http';
import { resumeRouter } from './routes.js';
import { skillsRouter } from '../skills/routes.js';
import { skillService } from '../skills/service.js';
import { ScoreEngine } from '../ranking/scoreEngine.js';
import { ResumeSkillExtractor } from './skillExtractor.js';
import { ResumeExtractor } from './resumeExtractor.js';

export async function runResumeSecurityPersistenceSuite() {
  console.log('=== STARTING RESUME IMPORT SECURITY & PERSISTENCE REGRESSION SUITE ===\n');

  // Set NODE_ENV to development for mock token auth if not set
  process.env.NODE_ENV = 'development';

  const app = express();
  app.use(express.json());
  app.use('/api/resume', resumeRouter);
  app.use('/api/skills', skillsRouter);

  const TEST_PORT = 5299;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`Test Express server listening on http://localhost:${TEST_PORT}`);
      resolve();
    });
  });

  const baseUrl = `http://localhost:${TEST_PORT}`;
  const validDevToken = 'mock-dev-token';
  const expectedAuthUserId = '00000000-0000-0000-0000-000000000001';

  try {
    // ------------------------------------------------------------------------
    // SCENARIO 1: Unauthenticated import is rejected
    // ------------------------------------------------------------------------
    console.log('--- TEST 1: Unauthenticated import is rejected (401) ---');

    // 1a. Missing Authorization header
    const resNoAuth = await fetch(`${baseUrl}/api/resume/import-claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        claims: [{ skillId: 's1', skillName: 'Node.js Architecture' }],
      }),
    });
    const jsonNoAuth = (await resNoAuth.json()) as any;
    console.log('1a. Missing auth header HTTP status:', resNoAuth.status, 'Code:', jsonNoAuth.error?.code);
    if (resNoAuth.status !== 401 || jsonNoAuth.success !== false) {
      throw new Error(`Expected 401 for missing auth, got ${resNoAuth.status}`);
    }

    // 1b. Malformed Authorization header
    const resMalformedAuth = await fetch(`${baseUrl}/api/resume/import-claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic invalid-credentials',
      },
      body: JSON.stringify({
        claims: [{ skillId: 's1', skillName: 'Node.js Architecture' }],
      }),
    });
    console.log('1b. Malformed auth header HTTP status:', resMalformedAuth.status);
    if (resMalformedAuth.status !== 401) {
      throw new Error(`Expected 401 for malformed auth header, got ${resMalformedAuth.status}`);
    }

    // 1c. Invalid Bearer token
    const resInvalidToken = await fetch(`${baseUrl}/api/resume/import-claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer totally-fake-token-12345',
      },
      body: JSON.stringify({
        claims: [{ skillId: 's1', skillName: 'Node.js Architecture' }],
      }),
    });
    console.log('1c. Invalid Bearer token HTTP status:', resInvalidToken.status);
    if (resInvalidToken.status !== 401) {
      throw new Error(`Expected 401 for invalid bearer token, got ${resInvalidToken.status}`);
    }
    console.log('PASS: All unauthenticated import attempts were rejected with 401.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 2: Authenticated user cannot import claims into another user's account
    // ------------------------------------------------------------------------
    console.log('--- TEST 2: Cross-user ownership enforcement (403 on mismatch) ---');
    const attackerTargetUserId = 'victim-candidate-uuid-999';

    const resMismatch = await fetch(`${baseUrl}/api/resume/import-claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validDevToken}`,
      },
      body: JSON.stringify({
        userId: attackerTargetUserId, // Attacker tries to inject claims into another account
        claims: [{ skillId: 's1', skillName: 'Node.js Architecture' }],
      }),
    });

    const jsonMismatch = (await resMismatch.json()) as any;
    console.log('2a. Target userId mismatch HTTP status:', resMismatch.status, 'Error:', jsonMismatch.error);
    if (resMismatch.status !== 403 || jsonMismatch.success !== false) {
      throw new Error(`Expected 403 Forbidden for target userId mismatch, got ${resMismatch.status}`);
    }

    // Confirm that victim account was NOT affected in the store
    const victimSkills = await skillService.getUserSkills(attackerTargetUserId);
    if (victimSkills.length !== 0) {
      throw new Error('SECURITY VIOLATION: Claims leaked into victim user account despite 403!');
    }
    console.log('PASS: Cross-account claim injection rejected and victim store is clean.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 3: Valid claims are persisted for the authenticated user
    // ------------------------------------------------------------------------
    console.log('--- TEST 3: Valid claims persisted for authenticated user (200) ---');
    skillService.clearUserSkillsForTesting(expectedAuthUserId);

    const validClaims = [
      {
        skillId: 's1',
        skillName: 'Node.js Architecture',
        category: 'Backend Core',
        domainSlug: 'backend-developer',
        difficulty: 'intermediate',
      },
      {
        skillId: 's2',
        skillName: 'PostgreSQL Indexing',
        category: 'Databases',
        domainSlug: 'backend-developer',
        difficulty: 'advanced',
      },
      {
        skillId: 's4',
        skillName: 'Redis Caching',
        category: 'Databases',
        domainSlug: 'backend-developer',
        difficulty: 'intermediate',
      },
    ];

    const resImportValid = await fetch(`${baseUrl}/api/resume/import-claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validDevToken}`,
      },
      body: JSON.stringify({
        claims: validClaims,
      }),
    });

    const jsonImportValid = (await resImportValid.json()) as any;
    console.log('3a. Import response HTTP status:', resImportValid.status, 'Success:', jsonImportValid.success);
    console.log('3b. Returned data:', {
      userId: jsonImportValid.data?.userId,
      importedCount: jsonImportValid.data?.importedCount,
    });

    if (resImportValid.status !== 200 || !jsonImportValid.success) {
      throw new Error(`Expected 200 for valid import, got ${resImportValid.status}`);
    }
    if (jsonImportValid.data.userId !== expectedAuthUserId) {
      throw new Error(`Expected userId to be authenticated ID ${expectedAuthUserId}, got ${jsonImportValid.data.userId}`);
    }
    if (jsonImportValid.data.importedCount !== 3) {
      throw new Error(`Expected 3 imported claims, got ${jsonImportValid.data.importedCount}`);
    }
    console.log('PASS: Valid claims imported successfully.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 4: Imported claims can be retrieved through existing skill retrieval paths
    // ------------------------------------------------------------------------
    console.log('--- TEST 4: Skill retrieval via skillService & /api/skills/my-skills ---');

    // 4a. Verify in skillService.getUserSkills
    const persistedSkills = await skillService.getUserSkills(expectedAuthUserId);
    console.log('4a. skillService.getUserSkills count:', persistedSkills.length);
    const persistedSkillIds = persistedSkills.map((s) => s.skillId);
    if (!persistedSkillIds.includes('s1') || !persistedSkillIds.includes('s2') || !persistedSkillIds.includes('s4')) {
      throw new Error(`Persisted skills missing expected IDs: ${JSON.stringify(persistedSkillIds)}`);
    }

    // 4b. Verify via GET /api/skills/my-skills endpoint
    const resMySkills = await fetch(`${baseUrl}/api/skills/my-skills`, {
      headers: { Authorization: `Bearer ${validDevToken}` },
    });
    const jsonMySkills = (await resMySkills.json()) as any;
    console.log('4b. /api/skills/my-skills HTTP status:', resMySkills.status, 'Returned skills count:', jsonMySkills.data?.skills?.length);
    if (resMySkills.status !== 200 || !jsonMySkills.data?.skills) {
      throw new Error('Failed to retrieve skills via /api/skills/my-skills');
    }
    const mySkillsIds = jsonMySkills.data.skills.map((s: any) => s.skillId);
    if (!mySkillsIds.includes('s1') || !mySkillsIds.includes('s2')) {
      throw new Error('my-skills response did not include imported resume claims');
    }

    // 4c. Verify profile aggregation in getVerifiedSkillProfile
    const profile = await skillService.getVerifiedSkillProfile(expectedAuthUserId);
    console.log('4c. Candidate profile - claimed skills:', profile.totalClaimedSkills, 'verified skills:', profile.totalVerifiedSkills);
    if (profile.totalClaimedSkills < 3) {
      throw new Error(`Expected totalClaimedSkills >= 3, got ${profile.totalClaimedSkills}`);
    }
    if (profile.totalVerifiedSkills !== 0) {
      throw new Error(`CRITICAL INVARIANT VIOLATION: Unverified resume claims counted as verified in profile!`);
    }
    console.log('PASS: Claims retrievable through existing skill endpoints and profile views.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 5: Imported claims remain UNVERIFIED with null verification score
    // ------------------------------------------------------------------------
    console.log('--- TEST 5: Strict invariant enforcement (UNVERIFIED & null score) ---');

    // Check all persisted records in store
    for (const record of persistedSkills) {
      if (record.status !== 'UNVERIFIED' && record.status !== 'CLAIMED') {
        throw new Error(`INVARIANT DEFECT: Record ${record.skillId} has status ${record.status}`);
      }
      if (record.verificationScore !== null) {
        throw new Error(`INVARIANT DEFECT: Record ${record.skillId} has verificationScore ${record.verificationScore}`);
      }
    }

    // Check client override attempt (client sends status: 'VERIFIED', verificationScore: 99.9)
    console.log('5b. Testing client override tamper attempt...');
    const resTamper = await fetch(`${baseUrl}/api/resume/import-claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validDevToken}`,
      },
      body: JSON.stringify({
        claims: [
          {
            skillId: 's5',
            skillName: 'Docker Containerization',
            status: 'VERIFIED', // Tamper attempt
            verificationScore: 99.9, // Tamper attempt
          },
        ],
      }),
    });
    const jsonTamper = (await resTamper.json()) as any;
    const tamperedClaim = jsonTamper.data.claims.find((c: any) => c.skillId === 's5');
    if (tamperedClaim.status !== 'UNVERIFIED' || tamperedClaim.verificationScore !== null) {
      throw new Error(`SECURITY DEFECT: Server allowed client to tamper status or score! ${JSON.stringify(tamperedClaim)}`);
    }

    const s5Record = await skillService.getUserSkill(expectedAuthUserId, 's5');
    if (!s5Record || s5Record.status !== 'UNVERIFIED' || s5Record.verificationScore !== null) {
      throw new Error(`SECURITY DEFECT: Tampered skill stored in database with non-null score or verified status!`);
    }
    console.log('PASS: Client cannot tamper status or score; claims remain strictly UNVERIFIED.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 6: Unverified claims do not increase competency scores or ranking
    // ------------------------------------------------------------------------
    console.log('--- TEST 6: Competency Score Engine immunity ---');
    const verifiedSkills = await skillService.getUserVerifiedSkills(expectedAuthUserId);
    console.log('6a. User verified skills count:', verifiedSkills.length);
    if (verifiedSkills.length !== 0) {
      throw new Error('getUserVerifiedSkills should return 0 skills for resume claims only');
    }

    const scoreResult = ScoreEngine.calculateCompetencyScore({
      userId: expectedAuthUserId,
      verifiedSkills: verifiedSkills.map((s) => ({
        skillId: s.skillId,
        skillName: s.skillId,
        category: 'core',
        difficulty: 'intermediate',
        verificationScore: s.verificationScore || 80,
        verificationDate: s.verificationDate || s.updatedAt,
      })),
      completedProjectsCount: 0,
      interviewSessions: [],
      domainCoverage: {
        domainSlug: 'backend-developer',
        domainName: 'Backend Developer',
        totalSkillsCount: 9,
        verifiedSkillsCount: 0,
      },
    });

    console.log('6b. Calculated Composite Score:', scoreResult.compositeScore, 'Tier:', scoreResult.tier);
    console.log('6c. Skill Mastery weighted score:', scoreResult.components.skillMastery.weightedScore);
    console.log('6d. Skill Difficulty weighted score:', scoreResult.components.skillDifficulty.weightedScore);

    if (scoreResult.components.skillMastery.weightedScore !== 0) {
      throw new Error('Competency score inflated by unverified resume claims!');
    }
    if (scoreResult.compositeScore !== 0) {
      throw new Error('Candidate score should be 0 with 0 verified skills!');
    }
    console.log('PASS: Unverified claims have exactly zero impact on competency score and ranking.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 7: Invalid payloads and malformed skill IDs handled correctly (400)
    // ------------------------------------------------------------------------
    console.log('--- TEST 7: Payload validation and malformed input handling (400) ---');

    // 7a. Empty claims array
    const resEmpty = await fetch(`${baseUrl}/api/resume/import-claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validDevToken}` },
      body: JSON.stringify({ claims: [] }),
    });
    if (resEmpty.status !== 400) throw new Error(`Expected 400 for empty claims array, got ${resEmpty.status}`);

    // 7b. Non-array claims
    const resNotArray = await fetch(`${baseUrl}/api/resume/import-claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validDevToken}` },
      body: JSON.stringify({ claims: 'not-an-array' }),
    });
    if (resNotArray.status !== 400) throw new Error(`Expected 400 for non-array claims, got ${resNotArray.status}`);

    // 7c. Malformed claim item (null or missing skillId)
    const resNullItem = await fetch(`${baseUrl}/api/resume/import-claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validDevToken}` },
      body: JSON.stringify({ claims: [null] }),
    });
    if (resNullItem.status !== 400) throw new Error(`Expected 400 for null claim item, got ${resNullItem.status}`);

    // 7d. Empty skillId string
    const resEmptySkillId = await fetch(`${baseUrl}/api/resume/import-claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validDevToken}` },
      body: JSON.stringify({ claims: [{ skillId: '   ' }] }),
    });
    if (resEmptySkillId.status !== 400) throw new Error(`Expected 400 for whitespace skillId, got ${resEmptySkillId.status}`);

    // 7e. Unrecognized / invalid skillId
    const resUnknownSkill = await fetch(`${baseUrl}/api/resume/import-claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validDevToken}` },
      body: JSON.stringify({ claims: [{ skillId: 'unknown-random-skill-999' }] }),
    });
    if (resUnknownSkill.status !== 400) throw new Error(`Expected 400 for unknown skillId, got ${resUnknownSkill.status}`);

    console.log('PASS: All malformed and invalid payloads rejected with 400 Bad Request.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 8: Deduplication and Idempotency
    // ------------------------------------------------------------------------
    console.log('--- TEST 8: Deduplication and Idempotency ---');
    const initialCount = (await skillService.getUserSkills(expectedAuthUserId)).length;

    // Re-import s1 and s2
    const resDuplicate = await fetch(`${baseUrl}/api/resume/import-claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validDevToken}` },
      body: JSON.stringify({
        claims: [{ skillId: 's1' }, { skillId: 's2' }],
      }),
    });
    if (resDuplicate.status !== 200) throw new Error(`Duplicate import failed: ${resDuplicate.status}`);

    const afterCount = (await skillService.getUserSkills(expectedAuthUserId)).length;
    if (afterCount !== initialCount) {
      throw new Error(`Deduplication failed: initial count was ${initialCount}, after duplicate import is ${afterCount}`);
    }

    // Verify verified skill is never downgraded by resume claim
    await skillService.recordVerificationResult(expectedAuthUserId, 's1', 95.0);
    const verifiedBefore = await skillService.getUserSkill(expectedAuthUserId, 's1');
    if (verifiedBefore?.status !== 'VERIFIED') throw new Error('Setup failed: s1 should be VERIFIED');

    // Re-import s1 as resume claim
    await fetch(`${baseUrl}/api/resume/import-claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validDevToken}` },
      body: JSON.stringify({ claims: [{ skillId: 's1' }] }),
    });

    const verifiedAfter = await skillService.getUserSkill(expectedAuthUserId, 's1');
    if (verifiedAfter?.status !== 'VERIFIED' || verifiedAfter?.verificationScore !== 95.0) {
      throw new Error('REGRESSION: Verified skill was downgraded by a resume claim import!');
    }
    console.log('PASS: Re-importing claims is idempotent and never downgrades verified skills.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 9: Existing extraction tests validation
    // ------------------------------------------------------------------------
    console.log('--- TEST 9: Existing resume text and skill extraction validation ---');
    const sampleText = `Alex Rivera
alex@example.com | (555) 987-6543
https://github.com/alexrivera

TECHNICAL SKILLS
Python, Docker, React, PostgreSQL, Node.js`;

    const textRes = ResumeExtractor.processResume({ rawText: sampleText, mimeType: 'text/plain' });
    if (!textRes.success || !textRes.sections.contact.email) {
      throw new Error('Resume text extraction regression detected');
    }

    const skillsRes = ResumeSkillExtractor.extractSkillsFromResume(textRes, expectedAuthUserId);
    console.log('9a. Matched skills count in extraction check:', skillsRes.matchedTaxonomySkills.length);
    if (!skillsRes.success || skillsRes.matchedTaxonomySkills.length === 0) {
      throw new Error('Resume skill extraction regression detected');
    }
    console.log('PASS: Core extraction engines continue to operate cleanly.\n');

    console.log('================================================================');
    console.log('🎉 ALL 9 REGRESSION TEST SCENARIOS PASSED WITH ZERO FAILURES!');
    console.log('================================================================');
  } finally {
    server.close();
  }
}

runResumeSecurityPersistenceSuite().catch((err) => {
  console.error('\n❌ REGRESSION SUITE FAILED:', err);
  process.exit(1);
});

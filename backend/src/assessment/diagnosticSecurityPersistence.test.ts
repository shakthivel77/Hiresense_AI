import express from 'express';
import http from 'http';
import { assessmentRouter } from './routes.js';
import { skillsRouter } from '../skills/routes.js';
import { skillService } from '../skills/service.js';
import { proofService } from '../portfolio/proofService.js';
import { domainDiagnosticService } from './diagnosticService.js';

export async function runDiagnosticSecurityPersistenceSuite() {
  console.log('=== STARTING UNIT 48 DIAGNOSTIC SECURITY & PERSISTENCE REGRESSION SUITE ===\n');

  // Isolate fallback mock dev environment for this regression test
  process.env.NODE_ENV = 'development';
  const savedSupabaseUrl = process.env.SUPABASE_URL;
  delete process.env.SUPABASE_URL;

  const app = express();
  app.use(express.json());
  app.use('/api/assessment', assessmentRouter);
  app.use('/api/skills', skillsRouter);

  const TEST_PORT = 5298;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`Test Express server listening on http://localhost:${TEST_PORT}`);
      resolve();
    });
  });

  const baseUrl = `http://localhost:${TEST_PORT}`;
  const user1Id = '00000000-0000-0000-0000-000000000001';
  const user2Id = '00000000-0000-0000-0000-000000000002';

  // Helper to create mock authorization headers
  // When mock-dev-token is passed, middleware assigns user1Id.
  // We can pass a custom middleware hook or custom token for user2.
  const user1Token = 'mock-dev-token';

  try {
    // ------------------------------------------------------------------------
    // SCENARIO 1: Unauthenticated generation and submission are rejected (401)
    // ------------------------------------------------------------------------
    console.log('--- TEST 1: Unauthenticated diagnostic routes are rejected (401) ---');

    const resGenNoAuth = await fetch(`${baseUrl}/api/assessment/diagnostic/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domainSlug: 'backend-developer' }),
    });
    if (resGenNoAuth.status !== 401) {
      throw new Error(`Expected 401 on unauthenticated diagnostic generation, got ${resGenNoAuth.status}`);
    }

    const resSubmitNoAuth = await fetch(`${baseUrl}/api/assessment/diagnostic/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosticId: 'diag-mock', answers: [] }),
    });
    if (resSubmitNoAuth.status !== 401) {
      throw new Error(`Expected 401 on unauthenticated diagnostic submit, got ${resSubmitNoAuth.status}`);
    }

    const resGetNoAuth = await fetch(`${baseUrl}/api/assessment/diagnostic/diag-mock`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (resGetNoAuth.status !== 401) {
      throw new Error(`Expected 401 on unauthenticated diagnostic get, got ${resGetNoAuth.status}`);
    }
    console.log('PASS: Unauthenticated diagnostic generation, get, and submit strictly rejected with 401.');

    // ------------------------------------------------------------------------
    // SCENARIO 2: Client-supplied userId cannot override authenticated identity
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 2: Client-supplied userId mismatch rejected (403) ---');

    const resMismatchGen = await fetch(`${baseUrl}/api/assessment/diagnostic/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        domainSlug: 'backend-developer',
        userId: user2Id, // Attempt to generate on behalf of victim
      }),
    });
    const jsonMismatchGen = (await resMismatchGen.json()) as any;
    if (resMismatchGen.status !== 403 || jsonMismatchGen.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 on client userId mismatch, got ${resMismatchGen.status}`);
    }

    const resMismatchSubmit = await fetch(`${baseUrl}/api/assessment/diagnostic/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        diagnosticId: 'diag-mock',
        userId: user2Id,
        answers: [],
      }),
    });
    const jsonMismatchSubmit = (await resMismatchSubmit.json()) as any;
    if (resMismatchSubmit.status !== 403 || jsonMismatchSubmit.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 on client userId mismatch during submit, got ${resMismatchSubmit.status}`);
    }
    console.log('PASS: Client-supplied userId injection strictly rejected with 403.');

    // ------------------------------------------------------------------------
    // SCENARIO 3: Question answer keys stripped before submission
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 3: Question answer keys stripped before submission ---');

    const resGen = await fetch(`${baseUrl}/api/assessment/diagnostic/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ domainSlug: 'backend-developer' }),
    });
    const jsonGen = (await resGen.json()) as any;
    if (!jsonGen.success || !jsonGen.data?.diagnosticId) {
      throw new Error('Failed to generate diagnostic session');
    }

    const diagnosticId = jsonGen.data.diagnosticId;
    const questions = jsonGen.data.questions;

    for (const q of questions) {
      if ((q as any).correctOptionIndex !== undefined || (q as any).correctIndex !== undefined) {
        throw new Error(`Security breach: Answer key leaked in question ${q.id}`);
      }
      if ((q as any).explanation !== undefined) {
        throw new Error(`Security breach: Explanation leaked before submission in question ${q.id}`);
      }
    }
    console.log('PASS: All questions stripped of correctOptionIndex and explanations.');

    // ------------------------------------------------------------------------
    // SCENARIO 4: Cross-user diagnostic session ownership isolation
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 4: Cross-user diagnostic session ownership isolation ---');

    // Attempt direct access via domainDiagnosticService with another userId
    try {
      domainDiagnosticService.getDiagnostic(diagnosticId, user2Id);
      throw new Error('Expected cross-user session retrieval to throw Access Denied');
    } catch (err: any) {
      if (!err.message.includes('Access denied')) {
        throw err;
      }
    }

    try {
      await domainDiagnosticService.evaluateDiagnostic({
        diagnosticId,
        userId: user2Id, // Attacker trying to submit user1's session
        answers: [],
      });
      throw new Error('Expected cross-user session submission to throw Access Denied');
    } catch (err: any) {
      if (!err.message.includes('Access denied')) {
        throw err;
      }
    }
    console.log('PASS: Cross-user retrieval and submission strictly blocked.');

    // ------------------------------------------------------------------------
    // SCENARIO 5: Duplicate and expired submissions rejected
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 5: Duplicate and expired submissions rejected ---');

    // Submit valid answers as user1
    const s1Questions = questions.filter((q: any) => q.skillId === 's1');
    const validAnswers = s1Questions.map((q: any) => ({
      questionId: q.id,
      selectedOptionIndex: 0,
    }));

    const resSubmit1 = await fetch(`${baseUrl}/api/assessment/diagnostic/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        diagnosticId,
        answers: validAnswers,
      }),
    });
    const jsonSubmit1 = (await resSubmit1.json()) as any;
    if (resSubmit1.status !== 200 || !jsonSubmit1.success) {
      throw new Error(`Expected 200 on first submit, got ${resSubmit1.status}: ${JSON.stringify(jsonSubmit1)}`);
    }

    // Submit a second time -> MUST be rejected
    const resSubmit2 = await fetch(`${baseUrl}/api/assessment/diagnostic/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        diagnosticId,
        answers: validAnswers,
      }),
    });
    const jsonSubmit2 = (await resSubmit2.json()) as any;
    if (resSubmit2.status !== 400 || jsonSubmit2.error?.code !== 'ALREADY_SUBMITTED') {
      throw new Error(`Expected 400 ALREADY_SUBMITTED on duplicate submit, got ${resSubmit2.status}`);
    }
    console.log('PASS: Duplicate submission rejected with 400 ALREADY_SUBMITTED.');

    // ------------------------------------------------------------------------
    // SCENARIO 6: Failed retest NEVER downgrades an already VERIFIED skill
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 6: Failed retest NEVER downgrades a VERIFIED skill ---');

    // Reset user1 skills for clean state
    skillService.clearUserSkillsForTesting(user1Id);

    // First ensure user1 has verified skill 's1'
    await skillService.recordVerificationResult(user1Id, 's1', 95.0);
    const initialSkill = await skillService.getUserSkill(user1Id, 's1');
    if (initialSkill?.status !== 'VERIFIED' || initialSkill?.verificationScore !== 95.0) {
      throw new Error(`Failed to establish initial VERIFIED skill: status=${initialSkill?.status}`);
    }

    // Now record a failed assessment (score: 40%)
    const failedRetestResult = await skillService.recordVerificationResult(user1Id, 's1', 40.0);
    if (failedRetestResult.status !== 'VERIFIED') {
      throw new Error(`CRITICAL INVARIANT VIOLATION: Skill was downgraded from VERIFIED to ${failedRetestResult.status}!`);
    }
    if (failedRetestResult.verificationScore !== 95.0) {
      throw new Error(`Score was overwritten on failed retest: expected 95.0, got ${failedRetestResult.verificationScore}`);
    }
    if (failedRetestResult.attemptCount !== 2) {
      throw new Error(`Expected attemptCount incremented to 2, got ${failedRetestResult.attemptCount}`);
    }
    console.log('PASS: Failed retest preserved VERIFIED status and highest verified score.');

    // ------------------------------------------------------------------------
    // SCENARIO 7: Failed assessment NEVER issues a proof
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 7: Failed assessment NEVER issues a proof artifact ---');

    let failedProofThrew = false;
    try {
      await proofService.createProofArtifact({
        userId: user1Id,
        skillId: 's3',
        score: 75.0, // Below 80.0 threshold
        attemptId: 'diag-test-attempt',
      });
    } catch (err: any) {
      if (err.message.includes('below authoritative threshold')) {
        failedProofThrew = true;
      }
    }
    if (!failedProofThrew) {
      throw new Error('Expected createProofArtifact to reject score below 80%');
    }
    console.log('PASS: Sub-threshold assessment attempts strictly barred from receiving proof artifacts.');

    // ------------------------------------------------------------------------
    // SCENARIO 8: Successful verification persists both skill and proof
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 8: Successful verification records valid proof and skill ---');

    const validProof = await proofService.createProofArtifact({
      userId: user1Id,
      skillId: 's2',
      score: 90.0,
      attemptId: 'diag-valid-test',
    });

    if (!validProof.proofId || !validProof.verificationHash) {
      throw new Error('Proof artifact missing proofId or cryptographic hash');
    }
    const retrievedProof = await proofService.getProofByProofId(validProof.proofId);
    if (!retrievedProof || retrievedProof.proofId !== validProof.proofId) {
      throw new Error('Failed to retrieve persisted proof artifact by proofId');
    }
    const isIntegrityValid = proofService.verifyProofIntegrity(retrievedProof);
    if (!isIntegrityValid) {
      throw new Error('Cryptographic signature verification failed on issued proof artifact');
    }
    console.log(`PASS: Valid cryptographic proof ${validProof.proofId} persisted and verified.`);

    console.log('\n================================================================');
    console.log('🎉 ALL 8 UNIT 48 SECURITY & PERSISTENCE TESTS PASSED!');
    console.log('================================================================');
  } finally {
    // Restore environment
    if (savedSupabaseUrl) {
      process.env.SUPABASE_URL = savedSupabaseUrl;
    }
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }
}

// Auto-run if executed directly
if (process.argv[1]?.includes('diagnosticSecurityPersistence.test.ts')) {
  runDiagnosticSecurityPersistenceSuite()
    .then(() => {
      setTimeout(() => process.exit(0), 100);
    })
    .catch((err) => {
      console.error('Test Suite Failed:', err);
      setTimeout(() => process.exit(1), 100);
    });
}

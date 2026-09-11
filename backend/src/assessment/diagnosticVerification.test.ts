import { domainDiagnosticService } from './diagnosticService.js';

async function runUnit48Verification() {
  console.log('--- STARTING UNIT 48 DOMAIN DIAGNOSTIC VERIFICATION ---');

  // 1. Generate Domain Diagnostic for Backend Developer track
  console.log('1. Generating Domain Diagnostic for backend-developer...');
  const diagnostic = await domainDiagnosticService.generateDomainDiagnostic({
    domainSlug: 'backend-developer',
    userId: 'cand-diagnostic-user',
    targetSkillIds: ['s1', 's2', 's3'], // Node.js, Postgres, REST Security
  });

  if (!diagnostic.diagnosticId || diagnostic.questions.length === 0) {
    throw new Error('Diagnostic generation failed or returned 0 questions');
  }

  console.log(`Generated Diagnostic ${diagnostic.diagnosticId}: ${diagnostic.totalQuestions} questions across ${diagnostic.totalSkillsTested} skills.`);

  // Verify answer keys are stripped
  diagnostic.questions.forEach((q: any) => {
    if (q.correctOptionIndex !== undefined) {
      throw new Error(`SECURITY INVARIANT VIOLATION: correctOptionIndex leaked in public question ${q.id}`);
    }
    if (!q.skillId || !q.skillName) {
      throw new Error(`Question ${q.id} missing skill tag`);
    }
  });
  console.log('Public diagnostic questions verified (answer keys stripped).');

  // 2. Simulate Mixed Diagnostic Submission:
  // - Node.js (s1): 2/2 correct (100% -> VERIFIED)
  // - PostgreSQL (s2): 2/2 correct (100% -> VERIFIED)
  // - REST Security (s3): 0/2 correct (0% -> UNVERIFIED)
  console.log('2. Simulating Diagnostic Submission with mixed mastery...');

  // Match question IDs by finding questions belonging to s1, s2, and s3
  const s1Questions = diagnostic.questions.filter((q) => q.skillId === 's1');
  const s2Questions = diagnostic.questions.filter((q) => q.skillId === 's2');
  const s3Questions = diagnostic.questions.filter((q) => q.skillId === 's3');

  const answers: Array<{ questionId: string; selectedOptionIndex: number }> = [
    // s1: Correct answers are index 0, index 1
    { questionId: s1Questions[0].id, selectedOptionIndex: 0 },
    { questionId: s1Questions[1].id, selectedOptionIndex: 1 },

    // s2: Correct answers are index 0, index 1
    { questionId: s2Questions[0].id, selectedOptionIndex: 0 },
    { questionId: s2Questions[1].id, selectedOptionIndex: 1 },

    // s3: Deliberately wrong answers (e.g. index 3)
    { questionId: s3Questions[0].id, selectedOptionIndex: 3 },
    { questionId: s3Questions[1].id, selectedOptionIndex: 3 },
  ];

  const evaluation = await domainDiagnosticService.evaluateDiagnostic({
    diagnosticId: diagnostic.diagnosticId,
    userId: 'cand-diagnostic-user',
    answers,
  });

  console.log(`Overall Diagnostic Score: ${evaluation.overallScore}%`);
  console.log(`Verified Skills: ${evaluation.verifiedSkillsCount}, Unverified: ${evaluation.unverifiedSkillsCount}`);

  // 3. Verify Per-Skill Independent Evaluation
  const s1Result = evaluation.skillBreakdown.find((s) => s.skillId === 's1');
  const s2Result = evaluation.skillBreakdown.find((s) => s.skillId === 's2');
  const s3Result = evaluation.skillBreakdown.find((s) => s.skillId === 's3');

  if (!s1Result || !s1Result.verified || s1Result.score !== 100) {
    throw new Error(`Expected s1 (Node.js) to be VERIFIED with 100%, got: ${s1Result?.score}%, verified=${s1Result?.verified}`);
  }
  if (!s1Result.proofId) {
    throw new Error('Expected cryptographic proofId issued for s1');
  }

  if (!s2Result || !s2Result.verified || s2Result.score !== 100) {
    throw new Error(`Expected s2 (PostgreSQL) to be VERIFIED with 100%, got: ${s2Result?.score}%, verified=${s2Result?.verified}`);
  }

  if (!s3Result || s3Result.verified || s3Result.score !== 0) {
    throw new Error(`Expected s3 (REST Security) to remain UNVERIFIED with 0%, got: ${s3Result?.score}%, verified=${s3Result?.verified}`);
  }

  if (evaluation.newlyVerifiedProofs.length !== 2) {
    throw new Error(`Expected 2 newly verified proofs, got ${evaluation.newlyVerifiedProofs.length}`);
  }

  if (evaluation.recommendedRemediations.length !== 1 || evaluation.recommendedRemediations[0].skillId !== 's3') {
    throw new Error('Expected remediation advice for s3');
  }

  // 4. Invariant Notice Check
  if (!evaluation.invariantNotice.includes('80%')) {
    throw new Error('Missing 80% verification invariant notice');
  }

  console.log('--- ALL UNIT 48 VERIFICATIONS PASSED SUCCESSFULLY ---');
}

void runUnit48Verification();

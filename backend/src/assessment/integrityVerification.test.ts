import assert from 'assert';
import { testService } from './testService.js';
import { questionBankService } from './questionBankService.js';
import { AssessmentIntegrityReport } from './types.js';

async function runUnit49IntegrityVerification() {
  console.log('--- STARTING UNIT 49 ASSESSMENT INTEGRITY SIGNALS VERIFICATION ---');

  const userId = 'u_integrity_test_learner';

  // 1. Create Question Bank for TypeScript with known questions
  const bank = await questionBankService.createQuestionBank('ts-integ-test', 'TypeScript Integrity Testing');
  const [q1, q2, q3] = await questionBankService.addQuestionsToBank(bank.id, [
    {
      questionText: 'What is TypeScript?',
      options: ['Typed JS', 'CSS Engine', 'Database', 'Browser'],
      correctOptionIndex: 0,
      explanation: 'TypeScript adds static types to JavaScript.',
      difficulty: 'beginner',
    },
    {
      questionText: 'Which keyword defines an interface?',
      options: ['interface', 'struct', 'typeclass', 'schema'],
      correctOptionIndex: 0,
      explanation: 'The interface keyword declares an interface.',
      difficulty: 'beginner',
    },
    {
      questionText: 'What is the return type of a void function?',
      options: ['void', 'null', 'undefined', 'never'],
      correctOptionIndex: 0,
      explanation: 'void indicates no return value.',
      difficulty: 'beginner',
    },
  ]);

  const questionIds = [q1.id, q2.id, q3.id];

  // Test 1: Clean Proctored Attempt with 100% score -> PASS & VERIFIED
  console.log('1. Testing clean assessment attempt (100% academic score, 100% integrity)...');
  const attempt1 = await testService.createAttempt(userId, 'ts-integ-test', questionIds);
  const cleanReport: AssessmentIntegrityReport = {
    integrityScore: 100,
    totalViolations: 0,
    tabSwitchesCount: 0,
    focusLossCount: 0,
    fullscreenExitCount: 0,
    clipboardActionsCount: 0,
    flaggedForReview: false,
    events: [],
  };

  const result1 = await testService.submitAttempt(
    attempt1.id,
    userId,
    [
      { questionId: q1.id, selectedOptionIndex: 0 },
      { questionId: q2.id, selectedOptionIndex: 0 },
      { questionId: q3.id, selectedOptionIndex: 0 },
    ],
    cleanReport
  );

  assert.strictEqual(result1.score, 100, 'Score must be 100%');
  assert.strictEqual(result1.passed, true, 'Clean attempt scoring >= 80% must pass');
  assert.ok(result1.integrityReport, 'Integrity report must be attached to result');
  assert.strictEqual(result1.integrityReport?.flaggedForReview, false, 'Clean attempt must not be flagged');
  console.log('✓ Clean attempt verified successfully (Passed: true, Flagged: false).');

  // Test 2: Attempt with 100% answer score but 4 tab switches (> 3 limit) -> FLAGGED & DISQUALIFIED
  console.log('2. Testing compromised attempt with > 3 tab switches (excessive tab switching)...');
  const attempt2 = await testService.createAttempt(userId, 'ts-integ-test', questionIds);
  const excessiveTabsReport: AssessmentIntegrityReport = {
    integrityScore: 40,
    totalViolations: 4,
    tabSwitchesCount: 4,
    focusLossCount: 0,
    fullscreenExitCount: 0,
    clipboardActionsCount: 0,
    flaggedForReview: true,
    events: [
      { id: '1', eventType: 'TAB_SWITCH', timestamp: new Date().toISOString() },
      { id: '2', eventType: 'TAB_SWITCH', timestamp: new Date().toISOString() },
      { id: '3', eventType: 'TAB_SWITCH', timestamp: new Date().toISOString() },
      { id: '4', eventType: 'TAB_SWITCH', timestamp: new Date().toISOString() },
    ],
  };

  const result2 = await testService.submitAttempt(
    attempt2.id,
    userId,
    [
      { questionId: q1.id, selectedOptionIndex: 0 },
      { questionId: q2.id, selectedOptionIndex: 0 },
      { questionId: q3.id, selectedOptionIndex: 0 },
    ],
    excessiveTabsReport
  );

  assert.strictEqual(result2.score, 100, 'Academic score is 100%');
  assert.strictEqual(result2.passed, false, 'Attempt with >3 tab switches must be disqualified (passed = false)');
  assert.strictEqual(result2.integrityReport?.flaggedForReview, true, 'Report must be flagged for review');
  assert.ok(result2.integrityWarning?.includes('flagged for review'), 'Integrity warning must explain flag reason');
  assert.strictEqual(result2.proofId, undefined, 'Proof must NOT be issued when integrity violation occurs');
  console.log('✓ Attempt with excessive tab switches correctly disqualified from verification.');

  // Test 3: Attempt with low integrity score (< 60) due to clipboard actions and focus loss -> DISQUALIFIED
  console.log('3. Testing compromised attempt with integrity score < 60...');
  const attempt3 = await testService.createAttempt(userId, 'ts-integ-test', questionIds);
  const lowIntegrityReport: AssessmentIntegrityReport = {
    integrityScore: 45,
    totalViolations: 5,
    tabSwitchesCount: 2,
    focusLossCount: 2,
    fullscreenExitCount: 1,
    clipboardActionsCount: 2,
    flaggedForReview: false, // Backend will re-compute and flag
    events: [],
  };

  const result3 = await testService.submitAttempt(
    attempt3.id,
    userId,
    [
      { questionId: q1.id, selectedOptionIndex: 0 },
      { questionId: q2.id, selectedOptionIndex: 0 },
      { questionId: q3.id, selectedOptionIndex: 0 },
    ],
    lowIntegrityReport
  );

  assert.strictEqual(result3.score, 100, 'Academic score is 100%');
  assert.strictEqual(result3.passed, false, 'Score < 60 integrity attempt must be disqualified');
  assert.strictEqual(result3.integrityReport?.flaggedForReview, true, 'Must flag report when score < 60');
  console.log('✓ Attempt with low integrity score (< 60) correctly disqualified.');

  console.log('--- ALL UNIT 49 ASSESSMENT INTEGRITY SIGNALS TESTS PASSED! ---');
}

runUnit49IntegrityVerification().catch((err) => {
  console.error('Integrity test failure:', err);
  process.exit(1);
});

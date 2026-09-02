import React from 'react';
import { TestEvaluationResult } from '../../lib/assessmentApi';
import { CheckCircle2, XCircle, Award, BookOpen, Check, X, ShieldAlert } from 'lucide-react';

interface AssessmentResultViewProps {
  result: TestEvaluationResult;
  skillName: string;
  onClose: () => void;
}

export const AssessmentResultView: React.FC<AssessmentResultViewProps> = ({
  result,
  skillName,
  onClose,
}) => {
  const isPassed = result.passed;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Result Status Banner */}
      <div
        className={`p-6 rounded-2xl border text-center space-y-3 ${
          isPassed
            ? 'bg-state-success/15 border-state-success/40 text-primary'
            : 'bg-state-warning/15 border-state-warning/40 text-primary'
        }`}
      >
        <div className="inline-flex p-3 rounded-full bg-base/80 border border-border">
          {isPassed ? (
            <Award className="h-10 w-10 text-state-success animate-bounce" />
          ) : (
            <ShieldAlert className="h-10 w-10 text-state-warning" />
          )}
        </div>

        <div>
          <span
            className={`text-xs uppercase font-mono font-bold tracking-wider px-3 py-1 rounded-full ${
              isPassed
                ? 'bg-state-success/20 text-state-success border border-state-success/30'
                : 'bg-state-warning/20 text-state-warning border border-state-warning/30'
            }`}
          >
            {isPassed ? 'VERIFIED COMPETENCY' : 'UNVERIFIED ATTEMPT'}
          </span>
          <h3 className="text-2xl font-bold text-primary mt-2">
            {isPassed ? `Congratulations! '${skillName}' Verified` : `Assessment Completed for '${skillName}'`}
          </h3>
          <p className="text-xs text-muted max-w-md mx-auto mt-1 leading-relaxed">
            {isPassed
              ? 'You scored >= 80%. This skill is now officially verified on your profile and unlocks all dependent roadmap competencies.'
              : 'You scored below the authoritative 80% passing threshold. Review the technical explanations below and study the curated materials before re-attempting.'}
          </p>
        </div>

        {/* Score Numbers Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2 font-mono text-xs">
          <div className="p-3 bg-base/80 rounded-xl border border-border">
            <span
              className={`text-xl font-bold block ${
                isPassed ? 'text-state-success' : 'text-state-warning'
              }`}
            >
              {result.score}%
            </span>
            <span className="text-[10px] text-muted uppercase">Your Score</span>
          </div>

          <div className="p-3 bg-base/80 rounded-xl border border-border">
            <span className="text-xl font-bold text-primary block">
              {result.correctAnswersCount}/{result.totalQuestions}
            </span>
            <span className="text-[10px] text-muted uppercase">Correct</span>
          </div>

          <div className="p-3 bg-base/80 rounded-xl border border-border">
            <span className="text-xl font-bold text-accent-primary block">80%</span>
            <span className="text-[10px] text-muted uppercase">Required</span>
          </div>
        </div>
      </div>

      {/* Newly Unlocked Competencies Banner */}
      {isPassed && result.newlyUnlockedSkills && result.newlyUnlockedSkills.length > 0 && (
        <div className="p-4 rounded-xl bg-accent-primary/10 border border-accent-primary/30 space-y-2">
          <div className="flex items-center gap-2 text-accent-primary font-semibold text-xs uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4" />
            <span>Downstream Competencies Unlocked!</span>
          </div>
          <p className="text-xs text-muted">
            By verifying this prerequisite, the following downstream skills are now available to take on your roadmap:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {result.newlyUnlockedSkills.map((unlocked) => (
              <span
                key={unlocked.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-accent-primary/40 text-xs font-semibold text-primary"
              >
                <span className="h-2 w-2 rounded-full bg-state-success animate-ping" />
                {unlocked.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Question Details Breakdown */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center justify-between">
          <span>Question-by-Question Review</span>
          <span className="font-mono text-primary">{result.details.length} Questions</span>
        </h4>

        <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
          {result.details.map((detail, idx) => (
            <div
              key={detail.questionId}
              className={`p-4 rounded-xl border ${
                detail.isCorrect
                  ? 'bg-base/60 border-state-success/30'
                  : 'bg-base/60 border-state-error/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-muted px-2 py-0.5 rounded bg-surface border border-border">
                    #{idx + 1}
                  </span>
                  <span
                    className={`text-xs font-semibold flex items-center gap-1 ${
                      detail.isCorrect ? 'text-state-success' : 'text-state-error'
                    }`}
                  >
                    {detail.isCorrect ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Correct
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" /> Incorrect
                      </>
                    )}
                  </span>
                </div>
              </div>

              <p className="text-sm font-medium text-primary mb-3 leading-relaxed">
                {detail.questionText}
              </p>

              {/* Options list */}
              <div className="space-y-2">
                {detail.options.map((opt, optIdx) => {
                  const isUserChoice = optIdx === detail.selectedOptionIndex;
                  const isCorrectChoice = optIdx === detail.correctOptionIndex;

                  let optClass = 'bg-surface/50 border-border text-muted';
                  if (isCorrectChoice) {
                    optClass = 'bg-state-success/15 border-state-success/50 text-primary font-medium';
                  } else if (isUserChoice && !detail.isCorrect) {
                    optClass = 'bg-state-error/15 border-state-error/50 text-state-error';
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${optClass}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] opacity-75">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <span>{opt}</span>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0 text-[10px] font-mono">
                        {isUserChoice && (
                          <span className="px-1.5 py-0.5 rounded bg-base/80 border border-border">
                            Your Choice
                          </span>
                        )}
                        {isCorrectChoice && (
                          <span className="text-state-success font-semibold flex items-center gap-0.5">
                            <Check className="h-3 w-3" /> Correct Answer
                          </span>
                        )}
                        {isUserChoice && !isCorrectChoice && (
                          <span className="text-state-error font-semibold flex items-center gap-0.5">
                            <X className="h-3 w-3" /> Wrong
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation note */}
              {detail.explanation && (
                <div className="mt-3 p-3 rounded-lg bg-surface border border-border/80 text-xs text-muted leading-relaxed">
                  <strong className="text-accent-primary font-semibold block mb-0.5">
                    Technical Explanation:
                  </strong>
                  {detail.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action footer */}
      <div className="pt-4 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted font-mono">
          Completed at {new Date(result.completedAt).toLocaleTimeString()}
        </span>

        <button
          onClick={onClose}
          className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary/90 text-base font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <BookOpen className="h-4 w-4" />
          <span>Return to Roadmap</span>
        </button>
      </div>
    </div>
  );
};

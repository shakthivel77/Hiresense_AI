import React, { useState, useEffect, useRef } from 'react';
import {
  PublicQuestion,
  PublicTestAttempt,
  TestEvaluationResult,
  startAssessment,
  submitAssessment,
  UserAnswerSubmission,
} from '../../lib/assessmentApi';
import { useAuth } from '../../context/AuthContext';
import { AssessmentResultView } from './AssessmentResultView';
import {
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface TimedAssessmentModalProps {
  skillId: string;
  skillName: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const TimedAssessmentModal: React.FC<TimedAssessmentModalProps> = ({
  skillId,
  skillName,
  isOpen,
  onClose,
  onComplete,
}) => {
  const { token } = useAuth();
  const [attempt, setAttempt] = useState<PublicTestAttempt | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TestEvaluationResult | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(15 * 60);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize test on open
  useEffect(() => {
    if (!isOpen) {
      setAttempt(null);
      setQuestions([]);
      setCurrentQIndex(0);
      setSelectedAnswers({});
      setResult(null);
      setError(null);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (!token) {
      setError('Please sign in to take skill assessments.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    startAssessment(skillId, token, 5)
      .then((data) => {
        if (!isMounted) return;
        setAttempt(data.attempt);
        setQuestions(data.questions);

        // Calculate seconds until expiration
        const expiryMs = new Date(data.attempt.expiresAt).getTime();
        const diffSecs = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
        setTimeLeftSeconds(diffSecs);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to start assessment');
        setLoading(false);
      });

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, skillId, token]);

  // Countdown timer effect
  useEffect(() => {
    if (!attempt || result || loading) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attempt, result, loading]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!attempt || !token || submitting) return;

    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < questions.length) {
      const confirmSubmit = window.confirm(
        `You have answered ${answeredCount} of ${questions.length} questions. Are you sure you want to submit now?`
      );
      if (!confirmSubmit) return;
    }

    try {
      setSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const formattedAnswers: UserAnswerSubmission[] = questions.map((q) => ({
        questionId: q.id,
        selectedOptionIndex: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1,
      }));

      const evalResult = await submitAssessment(attempt.id, formattedAnswers, token);
      setResult(evalResult);
    } catch (err: any) {
      setError(err.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (!attempt || !token) return;
    try {
      setSubmitting(true);
      const formattedAnswers: UserAnswerSubmission[] = questions.map((q) => ({
        questionId: q.id,
        selectedOptionIndex: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1,
      }));
      const evalResult = await submitAssessment(attempt.id, formattedAnswers, token);
      setResult(evalResult);
    } catch (err: any) {
      setError(err.message || 'Time expired; submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAndComplete = () => {
    if (onComplete) onComplete();
    onClose();
  };

  if (!isOpen) return null;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentQIndex];
  const isLastQuestion = currentQIndex === questions.length - 1;
  const answeredCount = Object.keys(selectedAnswers).length;
  const isTimeCritical = timeLeftSeconds < 120; // < 2 mins

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface border border-border w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Test Header */}
        <div className="p-5 border-b border-border bg-elevated/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-base rounded-lg border border-border">
              <HelpCircle className="h-5 w-5 text-accent-primary" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-muted">
                Timed Assessment
              </span>
              <h3 className="text-base font-bold text-primary">{skillName}</h3>
            </div>
          </div>

          {!result && attempt && (
            <div className="flex items-center gap-4">
              {/* Countdown Timer */}
              <div
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border font-mono text-xs font-bold ${
                  isTimeCritical
                    ? 'bg-state-error/15 border-state-error/40 text-state-error animate-pulse'
                    : 'bg-base border-border text-primary'
                }`}
              >
                <Clock className="h-4 w-4 text-accent-primary" />
                <span>{formatTimer(timeLeftSeconds)}</span>
              </div>

              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to quit the test? Unsubmitted answers will not be scored.')) {
                    onClose();
                  }
                }}
                className="p-1.5 text-muted hover:text-state-error rounded-lg hover:bg-elevated transition-colors"
                title="Quit test"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="p-16 text-center space-y-3">
              <Loader2 className="h-8 w-8 text-accent-primary animate-spin mx-auto" />
              <p className="text-xs font-mono text-muted">Preparing randomized question bank...</p>
            </div>
          ) : error && !result ? (
            <div className="p-8 text-center space-y-4">
              <div className="p-3 rounded-full bg-state-error/15 border border-state-error/30 text-state-error inline-block">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-primary">Unable to Run Assessment</h4>
                <p className="text-xs text-muted max-w-sm mx-auto mt-1">{error}</p>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-surface border border-border text-xs font-semibold rounded-lg text-primary hover:bg-elevated"
              >
                Close
              </button>
            </div>
          ) : result ? (
            <AssessmentResultView
              result={result}
              skillName={skillName}
              onClose={handleCloseAndComplete}
            />
          ) : currentQ ? (
            <div className="space-y-6">
              {/* Question Pagination Header */}
              <div className="flex items-center justify-between text-xs font-mono pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-accent-primary">
                    Question {currentQIndex + 1} of {questions.length}
                  </span>
                  <span className="text-muted capitalize">({currentQ.difficulty})</span>
                </div>

                <span className="text-muted">
                  {answeredCount}/{questions.length} Answered
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-base rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-accent-primary h-1.5 transition-all duration-300"
                  style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question Text */}
              <div className="p-4 rounded-xl bg-base/60 border border-border">
                <p className="text-sm font-medium text-primary leading-relaxed">
                  {currentQ.questionText}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((optionText, optIdx) => {
                  const isSelected = selectedAnswers[currentQ.id] === optIdx;

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQ.id, optIdx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-elevated border-accent-primary text-primary shadow-sm shadow-accent-primary/10'
                          : 'bg-surface border-border hover:border-border/80 hover:bg-elevated/40 text-muted'
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold mt-0.5 ${
                          isSelected
                            ? 'border-accent-primary bg-accent-primary text-base'
                            : 'border-border bg-base text-muted'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <span className="text-xs leading-relaxed flex-1">{optionText}</span>
                    </button>
                  );
                })}
              </div>

              {/* Fast Question Jump Bar */}
              <div className="pt-2 flex items-center justify-center gap-2">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentQIndex;
                  const isAnswered = selectedAnswers[q.id] !== undefined;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`h-7 w-7 rounded-lg text-xs font-mono font-semibold transition-all ${
                        isCurrent
                          ? 'bg-accent-primary text-base shadow-sm'
                          : isAnswered
                          ? 'bg-elevated text-primary border border-accent-primary/40'
                          : 'bg-base text-muted border border-border hover:border-border/80'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer Controls (Active Test Mode) */}
        {!result && !loading && !error && (
          <div className="p-5 border-t border-border bg-elevated/40 flex items-center justify-between">
            <button
              onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-surface border border-border text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-3">
              {isLastQuestion ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-state-success hover:bg-state-success/90 text-base font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Evaluating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Assessment</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-accent-primary text-base hover:bg-accent-primary/90 transition-colors shadow-sm"
                >
                  <span>Next Question</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

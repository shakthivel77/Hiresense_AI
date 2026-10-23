import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  DiagnosticTrack,
  PublicDomainDiagnostic,
  DomainDiagnosticEvaluation,
  DiagnosticAnswerSubmission,
  fetchDiagnosticTracks,
  generateDomainDiagnostic,
  submitDiagnosticAnswers,
} from '../../lib/diagnosticApi';
import {
  ShieldCheck,
  ShieldAlert,
  Award,
  Clock,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Layers,
  Sparkles,
  Copy,
  ExternalLink,
  Info,
  Target,
  LogIn,
} from 'lucide-react';

interface DomainDiagnosticViewProps {
  initialDomainSlug?: string;
  initialTargetSkillIds?: string[];
  onNavigateToRoadmap?: (domainSlug: string, skillId?: string) => void;
  onNavigateToPortfolio?: () => void;
  onOpenAuthModal?: () => void;
}

type DiagnosticPhase = 'select' | 'testing' | 'evaluating' | 'results';

export const DomainDiagnosticView: React.FC<DomainDiagnosticViewProps> = ({
  initialDomainSlug = 'backend-developer',
  initialTargetSkillIds,
  onNavigateToRoadmap,
  onNavigateToPortfolio,
  onOpenAuthModal,
}) => {
  const { user, token } = useAuth();

  // Phase & Configuration State
  const [phase, setPhase] = useState<DiagnosticPhase>('select');
  const [tracks, setTracks] = useState<DiagnosticTrack[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>(initialDomainSlug);
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(
    new Set(initialTargetSkillIds || [])
  );

  // Active Test State
  const [diagnostic, setDiagnostic] = useState<PublicDomainDiagnostic | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Results State
  const [evaluation, setEvaluation] = useState<DomainDiagnosticEvaluation | null>(null);

  // Loading & Error State
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedProofId, setCopiedProofId] = useState<string | null>(null);

  // Load Tracks on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingTracks(true);
    fetchDiagnosticTracks(token)
      .then((loadedTracks) => {
        if (!isMounted) return;
        setTracks(loadedTracks);
        // Ensure selectedDomain is valid
        if (loadedTracks.length > 0 && !loadedTracks.some((t) => t.slug === selectedDomain)) {
          setSelectedDomain(loadedTracks[0].slug);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMessage(err.message || 'Failed to load diagnostic tracks');
      })
      .finally(() => {
        if (isMounted) setIsLoadingTracks(false);
      });

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [token]);

  // When initialDomainSlug or initialTargetSkillIds change from outside props
  useEffect(() => {
    if (initialDomainSlug) {
      setSelectedDomain(initialDomainSlug);
    }
    if (initialTargetSkillIds && initialTargetSkillIds.length > 0) {
      setSelectedSkillIds(new Set(initialTargetSkillIds));
    }
  }, [initialDomainSlug, initialTargetSkillIds]);

  // Current track object
  const currentTrack = tracks.find((t) => t.slug === selectedDomain) || tracks[0];

  // Helper to toggle skill selection
  const toggleSkillSelection = (skillId: string) => {
    setSelectedSkillIds((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  };

  const handleSelectAllSkills = () => {
    if (!currentTrack) return;
    setSelectedSkillIds(new Set(currentTrack.skills.map((s) => s.id)));
  };

  const handleClearSkillSelection = () => {
    setSelectedSkillIds(new Set());
  };

  // 1. Generate & Start Diagnostic
  const handleStartDiagnostic = async () => {
    setErrorMessage(null);

    if (!user) {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      } else {
        setErrorMessage('Authentication required: Please sign in to generate and take a domain diagnostic assessment.');
      }
      return;
    }

    setIsGenerating(true);

    try {
      const targetSkillIds =
        selectedSkillIds.size > 0 ? Array.from(selectedSkillIds) : undefined;

      const generated = await generateDomainDiagnostic(
        {
          domainSlug: selectedDomain,
          userId: user?.id,
          targetSkillIds,
        },
        token
      );

      if (!generated || !generated.questions || generated.questions.length === 0) {
        throw new Error('No diagnostic questions were generated for the selected track.');
      }

      setDiagnostic(generated);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setEvaluation(null);

      // Initialize countdown timer based on timeLimitMinutes
      const initialSeconds = Math.max(generated.timeLimitMinutes * 60, 60);
      setTimeLeftSeconds(initialSeconds);

      setPhase('testing');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start diagnostic assessment');
    } finally {
      setIsGenerating(false);
    }
  };

  // Timer countdown hook for testing phase
  useEffect(() => {
    if (phase !== 'testing' || !diagnostic) return;

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
  }, [phase, diagnostic]);

  // Option selection
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (phase !== 'testing' || isSubmitting) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  // Submit assessment
  const handleSubmitAssessment = async (isAutoSubmit = false) => {
    if (!diagnostic || isSubmitting) return;

    if (!isAutoSubmit) {
      const totalQ = diagnostic.questions.length;
      const answeredQ = Object.keys(answers).length;
      if (answeredQ < totalQ) {
        const proceed = window.confirm(
          `You have answered ${answeredQ} of ${totalQ} questions. Unanswered questions will be scored as incorrect. Are you sure you want to submit?`
        );
        if (!proceed) return;
      }
    }

    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitting(true);
    setErrorMessage(null);
    setPhase('evaluating');

    try {
      const formattedAnswers: DiagnosticAnswerSubmission[] = diagnostic.questions.map((q) => ({
        questionId: q.id,
        selectedOptionIndex: answers[q.id] !== undefined ? answers[q.id] : -1,
      }));

      const evalResult = await submitDiagnosticAnswers(
        diagnostic.diagnosticId,
        user?.id || '',
        formattedAnswers,
        token
      );

      setEvaluation(evalResult);
      setPhase('results');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to evaluate diagnostic assessment');
      setPhase('testing'); // Allow review / retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    handleSubmitAssessment(true);
  };

  // Copy proof ID
  const handleCopyProofId = (proofId: string) => {
    navigator.clipboard.writeText(proofId);
    setCopiedProofId(proofId);
    setTimeout(() => setCopiedProofId(null), 2500);
  };

  // Reset to selection
  const handleRetake = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setDiagnostic(null);
    setEvaluation(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setErrorMessage(null);
    setPhase('select');
  };

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-primary px-2 py-0.5 rounded bg-accent-primary/10 border border-accent-primary/20">
              Unit 48
            </span>
            <span className="text-xs text-muted">Multi-Skill Assessment Engine</span>
          </div>
          <h2 className="text-2xl font-bold text-primary mt-1 flex items-center gap-2">
            <Award className="h-6 w-6 text-accent-primary" />
            Domain Competency Diagnostic
          </h2>
          <p className="text-xs text-muted mt-1 max-w-2xl leading-relaxed">
            Test and verify multi-skill competency across a specific technical domain in a single structured session.
            Each skill is evaluated independently against the authoritative <strong className="text-primary font-mono">&gt;= 80.0%</strong> passing standard.
          </p>
        </div>

        {phase === 'results' && (
          <button
            onClick={handleRetake}
            className="flex items-center gap-2 text-xs bg-elevated hover:bg-elevated/80 border border-border text-primary px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap self-start"
          >
            <RotateCcw className="h-3.5 w-3.5 text-accent-secondary" />
            <span>New Diagnostic Session</span>
          </button>
        )}
      </div>

      {/* Core Verification Invariant Alert */}
      <div className="bg-gradient-to-r from-surface to-elevated border border-accent-primary/30 rounded-xl p-4 flex items-start gap-3.5 text-xs">
        <ShieldCheck className="h-5 w-5 text-accent-primary flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-primary flex items-center gap-2">
            <span>Authoritative Per-Skill Verification Standard</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-state-success/10 text-state-success border border-state-success/20">
              Score &gt;= 80% Required
            </span>
          </p>
          <p className="text-muted leading-relaxed">
            Unverified resume claims and career gap skills transition to <strong className="text-state-success font-mono">VERIFIED</strong> with immutable cryptographic proofs <strong className="text-primary">if and only if</strong> that specific skill scores <span className="text-primary font-mono">&gt;= 80%</span>. Skills scoring below 80% strictly remain <span className="text-state-warning font-mono">UNVERIFIED</span> and receive targeted roadmap remediation advice.
          </p>
          <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted">
            <Info className="h-3 w-3 text-accent-secondary" />
            <span>Deterministic server-side scoring. Assessment tests technical mastery via authoritative questions without intrusive webcam monitoring.</span>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-state-error/10 border border-state-error/30 rounded-xl flex items-start gap-3 text-xs text-state-error">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Diagnostic Error</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-muted hover:text-primary"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =========================================================================
          PHASE 1: DOMAIN & SKILL SELECTION
         ========================================================================= */}
      {phase === 'select' && (
        <div className="space-y-6">
          {/* Domain Track Selection Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent-secondary" />
              1. Select Domain Track
            </h3>

            {isLoadingTracks ? (
              <div className="p-12 text-center bg-surface rounded-xl border border-border text-muted text-xs animate-pulse">
                Loading domain tracks and skill taxonomy...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tracks.map((track) => {
                  const isSelected = selectedDomain === track.slug;
                  return (
                    <div
                      key={track.slug}
                      onClick={() => {
                        setSelectedDomain(track.slug);
                        // Reset specific skill filter when changing track
                        setSelectedSkillIds(new Set());
                      }}
                      className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                        isSelected
                          ? 'border-accent-primary bg-elevated/90 shadow-md ring-1 ring-accent-primary/40'
                          : 'border-border bg-surface hover:border-border/80 hover:bg-elevated/40'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-primary">{track.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-base border border-border text-accent-primary font-semibold">
                            {track.totalSkills} Skills
                          </span>
                        </div>
                        <p className="text-xs text-muted leading-relaxed">
                          {track.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border/50 flex items-center justify-between text-[11px]">
                        <span className="text-muted font-mono">
                          ~{track.skills.reduce((acc, s) => acc + s.questionCount, 0) * 2} min estimated
                        </span>
                        <span
                          className={`font-semibold flex items-center gap-1 ${
                            isSelected ? 'text-accent-primary' : 'text-muted'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select Track'}
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Skill Scope Configuration */}
          {currentTrack && (
            <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                    <Target className="h-4 w-4 text-accent-primary" />
                    2. Customize Skills to Test in {currentTrack.name}
                  </h3>
                  <p className="text-[11px] text-muted mt-0.5">
                    Leave all selected to verify the complete domain track, or toggle specific unverified skills.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAllSkills}
                    className="text-xs text-muted hover:text-primary px-2.5 py-1 rounded bg-elevated border border-border transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleClearSkillSelection}
                    className="text-xs text-muted hover:text-primary px-2.5 py-1 rounded bg-elevated border border-border transition-colors"
                  >
                    Clear Filter
                  </button>
                </div>
              </div>

              {/* Skills List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentTrack.skills.map((skill) => {
                  const isChecked =
                    selectedSkillIds.size === 0 || selectedSkillIds.has(skill.id);

                  return (
                    <div
                      key={skill.id}
                      onClick={() => toggleSkillSelection(skill.id)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-elevated border-accent-primary/50'
                          : 'bg-base/50 border-border opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSkillSelection(skill.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-border text-accent-primary focus:ring-0 mt-0.5 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-xs font-bold text-primary truncate">{skill.name}</h5>
                          <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-base border border-border text-muted">
                            {skill.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted mt-1">
                          <span>{skill.category}</span>
                          <span className="font-mono text-accent-primary">
                            {skill.questionCount} {skill.questionCount === 1 ? 'question' : 'questions'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ready to Launch Bar */}
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-primary font-medium">
                    <Sparkles className="h-4 w-4 text-accent-secondary" />
                    <span>
                      Testing {selectedSkillIds.size > 0 ? selectedSkillIds.size : currentTrack.skills.length} skills (
                      {currentTrack.skills
                        .filter((s) => selectedSkillIds.size === 0 || selectedSkillIds.has(s.id))
                        .reduce((acc, s) => acc + s.questionCount, 0)}{' '}
                      authoritative questions)
                    </span>
                  </div>
                  <p className="text-[11px] text-muted">
                    {user ? (
                      <span className="text-state-success">
                        Session authenticated as {user.email}. Proofs will be permanently linked to your profile.
                      </span>
                    ) : (
                      <span className="text-state-warning">
                        Unauthenticated. We recommend signing in so verification proofs persist to your permanent portfolio.
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {!user && onOpenAuthModal && (
                    <button
                      onClick={onOpenAuthModal}
                      className="text-xs text-muted hover:text-primary px-3 py-2 rounded-lg border border-border transition-colors flex items-center gap-1.5"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      <span>Sign In First</span>
                    </button>
                  )}

                  <button
                    onClick={handleStartDiagnostic}
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-base font-semibold text-xs px-6 py-2.5 rounded-lg transition-colors shadow-sm"
                  >
                    {isGenerating ? (
                      <>
                        <RotateCcw className="h-4 w-4 animate-spin" />
                        <span>Generating Diagnostic...</span>
                      </>
                    ) : (
                      <>
                        <span>Begin Diagnostic Assessment</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          PHASE 2: ACTIVE DIAGNOSTIC ASSESSMENT
         ========================================================================= */}
      {phase === 'testing' && diagnostic && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Diagnostic Test Header */}
          <div className="bg-surface rounded-xl border border-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-16 z-20 backdrop-blur-md bg-surface/90">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-primary/10 border border-accent-primary/20 text-accent-primary font-bold">
                  {diagnostic.domainName}
                </span>
                <span className="text-xs text-muted font-mono">{diagnostic.diagnosticId}</span>
              </div>
              <h3 className="text-base font-bold text-primary mt-1">{diagnostic.title}</h3>
            </div>

            {/* Countdown Timer */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono text-sm font-bold ${
                timeLeftSeconds <= 60
                  ? 'bg-state-error/15 border-state-error text-state-error animate-pulse'
                  : timeLeftSeconds <= 180
                  ? 'bg-state-warning/15 border-state-warning text-state-warning'
                  : 'bg-elevated border-border text-primary'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeLeftSeconds)}</span>
              {timeLeftSeconds <= 60 && <span className="text-[10px] uppercase font-sans">Ending soon</span>}
            </div>
          </div>

          {/* Progress bar & Question Jump Pills */}
          <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted font-mono">
              <span>
                Question {currentQuestionIndex + 1} of {diagnostic.questions.length}
              </span>
              <span>
                {Math.round(((currentQuestionIndex + 1) / diagnostic.questions.length) * 100)}% Progress •{' '}
                {Object.keys(answers).length} of {diagnostic.questions.length} Answered
              </span>
            </div>

            {/* Linear Progress Bar */}
            <div className="h-1.5 w-full bg-base rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-primary transition-all duration-300 rounded-full"
                style={{
                  width: `${((currentQuestionIndex + 1) / diagnostic.questions.length) * 100}%`,
                }}
              />
            </div>

            {/* Jump Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {diagnostic.questions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = answers[q.id] !== undefined;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-7 min-w-7 px-2 rounded text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1 ${
                      isCurrent
                        ? 'bg-accent-primary text-base ring-2 ring-accent-primary/40'
                        : isAnswered
                        ? 'bg-elevated text-primary border border-accent-primary/40'
                        : 'bg-base text-muted hover:text-primary border border-border'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isAnswered && <Check className="h-2.5 w-2.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Question Card */}
          {(() => {
            const currentQuestion = diagnostic.questions[currentQuestionIndex];
            if (!currentQuestion) return null;
            const currentSelectedOption = answers[currentQuestion.id];

            return (
              <div className="bg-surface rounded-xl border border-border p-6 space-y-5">
                {/* Question Metadata Tags */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-primary/10 border border-accent-primary/20 text-accent-primary font-bold">
                    Skill: {currentQuestion.skillName}
                  </span>
                  <span className="text-[10px] text-muted bg-base px-2 py-0.5 rounded border border-border">
                    {currentQuestion.category}
                  </span>
                  <span className="text-[10px] text-muted uppercase bg-base px-2 py-0.5 rounded border border-border">
                    {currentQuestion.difficulty}
                  </span>
                </div>

                {/* Question Statement */}
                <h3 className="text-base font-semibold text-primary leading-relaxed">
                  {currentQuestion.questionText}
                </h3>

                {/* Multiple Choice Options */}
                <div className="space-y-3 pt-2">
                  {currentQuestion.options.map((optionText, optIdx) => {
                    const isSelected = currentSelectedOption === optIdx;

                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                          isSelected
                            ? 'bg-elevated border-accent-primary ring-1 ring-accent-primary/40 text-primary'
                            : 'bg-base/70 border-border hover:border-border/80 hover:bg-elevated/40 text-muted hover:text-primary'
                        }`}
                      >
                        <div
                          className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-mono font-bold mt-0.5 flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-accent-primary text-base'
                              : 'bg-elevated border border-border text-muted'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className="text-xs leading-relaxed flex-1 select-none">
                          {optionText}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Question Navigation Footer */}
                <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center gap-1.5 text-xs text-muted hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-lg bg-elevated border border-border transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {currentQuestionIndex < diagnostic.questions.length - 1 ? (
                      <button
                        onClick={() =>
                          setCurrentQuestionIndex((prev) =>
                            Math.min(diagnostic.questions.length - 1, prev + 1)
                          )
                        }
                        className="flex items-center gap-1.5 bg-elevated hover:bg-elevated/80 border border-border text-primary text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        <span>Next Question</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSubmitAssessment(false)}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 bg-state-success hover:bg-state-success/90 text-white text-xs font-bold px-5 py-2 rounded-lg transition-colors shadow-sm"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Submit Diagnostic Assessment</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* =========================================================================
          PHASE 2.5: EVALUATING SPINNER
         ========================================================================= */}
      {phase === 'evaluating' && (
        <div className="p-16 text-center bg-surface rounded-2xl border border-border space-y-4 animate-pulse">
          <RotateCcw className="h-10 w-10 text-accent-primary animate-spin mx-auto" />
          <h3 className="text-lg font-bold text-primary">Evaluating Domain Diagnostic...</h3>
          <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
            Scoring technical answers against authoritative question banks and applying the deterministic{' '}
            <strong className="text-primary font-mono">&gt;= 80.0%</strong> per-skill verification threshold.
          </p>
        </div>
      )}

      {/* =========================================================================
          PHASE 3: DIAGNOSTIC EVALUATION RESULTS & RECOMMENDATIONS
         ========================================================================= */}
      {phase === 'results' && evaluation && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Hero Score Card */}
          <div className="bg-surface rounded-2xl border border-border p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-primary px-2.5 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20">
                  Diagnostic Evaluation Complete
                </span>
                <h3 className="text-xl font-bold text-primary mt-2">
                  {diagnostic?.domainName || 'Domain'} Diagnostic Results
                </h3>
                <p className="text-xs text-muted mt-1 font-mono">
                  Completed on {new Date(evaluation.completedAt).toLocaleString()}
                </p>
              </div>

              {/* Status Badge */}
              <div
                className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 ${
                  evaluation.verifiedSkillsCount > 0
                    ? 'bg-state-success/10 border-state-success/30 text-state-success'
                    : 'bg-state-warning/10 border-state-warning/30 text-state-warning'
                }`}
              >
                {evaluation.verifiedSkillsCount > 0 ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <ShieldAlert className="h-5 w-5" />
                )}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block">
                    {evaluation.verifiedSkillsCount > 0
                      ? `${evaluation.verifiedSkillsCount} Competencies Verified`
                      : 'Verification Incomplete'}
                  </span>
                  <span className="text-[11px] text-muted">
                    {evaluation.verifiedSkillsCount} verified, {evaluation.unverifiedSkillsCount} unverified
                  </span>
                </div>
              </div>
            </div>

            {/* Score Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="p-4 bg-base/80 rounded-xl border border-border text-center">
                <span className="text-2xl font-bold text-primary block font-mono">
                  {evaluation.overallScore}%
                </span>
                <span className="text-[10px] text-muted uppercase tracking-wider">Overall Domain Score</span>
              </div>

              <div className="p-4 bg-base/80 rounded-xl border border-border text-center">
                <span className="text-2xl font-bold text-state-success block font-mono">
                  {evaluation.verifiedSkillsCount}
                </span>
                <span className="text-[10px] text-muted uppercase tracking-wider">Verified (&gt;= 80%)</span>
              </div>

              <div className="p-4 bg-base/80 rounded-xl border border-border text-center">
                <span className="text-2xl font-bold text-state-warning block font-mono">
                  {evaluation.unverifiedSkillsCount}
                </span>
                <span className="text-[10px] text-muted uppercase tracking-wider">Unverified (&lt; 80%)</span>
              </div>

              <div className="p-4 bg-base/80 rounded-xl border border-border text-center">
                <span className="text-2xl font-bold text-accent-primary block font-mono">
                  {evaluation.newlyVerifiedProofs.length}
                </span>
                <span className="text-[10px] text-muted uppercase tracking-wider">Proofs Issued</span>
              </div>
            </div>

            {/* Server Invariant Notice Callout */}
            <div className="p-3 bg-elevated/70 rounded-lg border border-border text-xs text-muted leading-relaxed">
              <strong className="text-primary font-medium">Standard Compliance Notice: </strong>
              {evaluation.invariantNotice}
            </div>
          </div>

          {/* Newly Verified Proofs Section if any */}
          {evaluation.newlyVerifiedProofs.length > 0 && (
            <div className="bg-gradient-to-r from-state-success/10 to-surface rounded-xl border border-state-success/30 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-state-success flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Newly Issued Cryptographic Verification Proofs ({evaluation.newlyVerifiedProofs.length})
                </h4>
                {onNavigateToPortfolio && (
                  <button
                    onClick={onNavigateToPortfolio}
                    className="text-xs text-state-success hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>View in Portfolio</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {evaluation.newlyVerifiedProofs.map((proof) => (
                  <div
                    key={proof.proofId}
                    className="bg-base/80 p-3.5 rounded-lg border border-state-success/40 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-primary">{proof.skillName}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[11px] text-accent-primary bg-elevated px-2 py-0.5 rounded border border-border">
                          {proof.proofId}
                        </span>
                        <span className="text-[10px] text-state-success font-semibold">
                          Score: {proof.score}%
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyProofId(proof.proofId)}
                      className="p-2 rounded bg-elevated border border-border text-muted hover:text-primary transition-colors flex items-center gap-1 text-xs"
                      title="Copy Proof ID"
                    >
                      {copiedProofId === proof.proofId ? (
                        <Check className="h-3.5 w-3.5 text-state-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-Skill Diagnostic Breakdown (Core Unit 48 Requirement) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent-secondary" />
              Per-Skill Evaluation Breakdown
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {evaluation.skillBreakdown.map((item) => (
                <div
                  key={item.skillId}
                  className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                    item.verified
                      ? 'bg-surface border-state-success/40'
                      : 'bg-surface border-state-warning/40'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-sm font-bold text-primary">{item.skillName}</h5>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted mt-1">
                          <span className="bg-base px-1.5 py-0.2 rounded border border-border">
                            {item.category}
                          </span>
                          <span className="capitalize bg-base px-1.5 py-0.2 rounded border border-border">
                            {item.difficulty}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
                          item.verified
                            ? 'bg-state-success/15 border-state-success/40 text-state-success'
                            : 'bg-state-warning/15 border-state-warning/40 text-state-warning'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Progress Bar & Questions Count */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-muted">
                          {item.correctAnswers} / {item.questionsTested} correct
                        </span>
                        <span
                          className={`font-bold ${
                            item.verified ? 'text-state-success' : 'text-state-warning'
                          }`}
                        >
                          {item.score}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-base rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.verified ? 'bg-state-success' : 'bg-state-warning'
                          }`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>

                    {/* Feedback */}
                    <p className="text-xs text-muted leading-relaxed">
                      {item.feedback}
                    </p>
                  </div>

                  {/* Proof ID if verified */}
                  {item.proofId && (
                    <div className="pt-3 border-t border-border/50 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-muted text-[10px]">Proof: {item.proofId}</span>
                      <button
                        onClick={() => handleCopyProofId(item.proofId!)}
                        className="text-accent-primary hover:underline flex items-center gap-1 text-[11px]"
                      >
                        {copiedProofId === item.proofId ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Remediations Section */}
          {evaluation.recommendedRemediations.length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-state-warning flex items-center gap-2">
                <Target className="h-4 w-4" />
                Targeted Remediation & Roadmap Guidance ({evaluation.recommendedRemediations.length})
              </h4>
              <p className="text-xs text-muted">
                Skills below the 80% passing standard remain unverified. Use the curated roadmap to study prerequisite concepts before retrying.
              </p>

              <div className="space-y-3 pt-1">
                {evaluation.recommendedRemediations.map((rem) => (
                  <div
                    key={rem.skillId}
                    className="p-4 rounded-lg bg-base/60 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">{rem.skillName}</span>
                        <span className="text-[10px] font-mono text-muted bg-elevated px-1.5 py-0.2 rounded border border-border">
                          {rem.skillId}
                        </span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">{rem.reason}</p>
                    </div>

                    {onNavigateToRoadmap && (
                      <button
                        onClick={() => onNavigateToRoadmap(evaluation.domainSlug, rem.skillId)}
                        className="flex items-center gap-1.5 bg-elevated hover:bg-elevated/80 border border-border text-primary text-xs font-medium px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
                      >
                        <BookOpen className="h-3.5 w-3.5 text-accent-secondary" />
                        <span>Study on Roadmap</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleRetake}
              className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary/90 text-base font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retake Diagnostic</span>
            </button>

            <div className="flex items-center gap-3">
              {onNavigateToRoadmap && (
                <button
                  onClick={() => onNavigateToRoadmap(evaluation.domainSlug)}
                  className="flex items-center gap-1.5 bg-elevated hover:bg-elevated/80 border border-border text-primary text-xs font-medium px-4 py-2.5 rounded-lg transition-colors"
                >
                  <BookOpen className="h-4 w-4 text-accent-secondary" />
                  <span>Go to Domain Roadmap</span>
                </button>
              )}

              {onNavigateToPortfolio && (
                <button
                  onClick={onNavigateToPortfolio}
                  className="flex items-center gap-1.5 bg-elevated hover:bg-elevated/80 border border-border text-primary text-xs font-medium px-4 py-2.5 rounded-lg transition-colors"
                >
                  <ShieldCheck className="h-4 w-4 text-state-success" />
                  <span>View Verified Portfolio</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

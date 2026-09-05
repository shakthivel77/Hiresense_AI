import { useState, useEffect, useRef } from 'react';
import {
  InterviewSession,
  SessionEvaluation,
  InterviewDifficulty,
  createInterviewSession,
  fetchUserInterviewSessions,
  submitInterviewAnswer,
  skipInterviewQuestion,
  abandonInterviewSession,
  evaluateInterviewSession,
} from '../../lib/interviewApi';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  Mic,
  MicOff,
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  ChevronRight,
  ShieldCheck,
  Zap,
  Target,
  FileText,
  BarChart2,
} from 'lucide-react';

interface MockInterviewViewProps {
  onNavigateToRoadmap?: (domainSlug: string, skillId?: string) => void;
}

const DOMAINS = [
  {
    slug: 'backend-developer',
    title: 'Backend Systems Engineer',
    description: 'PostgreSQL optimization, REST idempotency, Redis caching, microservices & Docker.',
    badge: 'Backend Focus',
    color: 'text-accent-primary',
    bg: 'bg-accent-primary/10',
    border: 'border-accent-primary/30',
  },
  {
    slug: 'frontend-developer',
    title: 'Frontend React Architect',
    description: 'React render lifecycles, Core Web Vitals (LCP/CLS), state machines, event loops.',
    badge: 'Frontend Focus',
    color: 'text-accent-secondary',
    bg: 'bg-accent-secondary/10',
    border: 'border-accent-secondary/30',
  },
  {
    slug: 'ai-data-engineer',
    title: 'AI & Data Platforms Engineer',
    description: 'PyTorch deep learning, enterprise RAG architectures, vector search, streaming data.',
    badge: 'AI & Data Focus',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
  },
];

export function MockInterviewView({ onNavigateToRoadmap }: MockInterviewViewProps) {
  const { user } = useAuth();
  const token = (user as any)?.token;

  // View state: 'CONFIG' | 'PRACTICE' | 'REPORT'
  const [viewMode, setViewMode] = useState<'CONFIG' | 'PRACTICE' | 'REPORT'>('CONFIG');

  // Config State
  const [selectedDomain, setSelectedDomain] = useState<string>('backend-developer');
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('intermediate');
  const [questionCount, setQuestionCount] = useState<number>(4);
  const [includeBehavioral, setIncludeBehavioral] = useState<boolean>(true);

  // Active Session & Questions
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [pastSessions, setPastSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Practice Room State
  const [answerText, setAnswerText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Evaluation Report State
  const [evaluation, setEvaluation] = useState<SessionEvaluation | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);

  // Load history on mount
  useEffect(() => {
    loadPastSessions();
  }, []);

  // Timer logic for recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const loadPastSessions = async () => {
    try {
      const list = await fetchUserInterviewSessions(token);
      setPastSessions(list);
    } catch (_) {}
  };

  const handleStartSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await createInterviewSession(
        {
          domainSlug: selectedDomain,
          difficulty,
          questionCount,
          includeBehavioral,
        },
        token
      );
      setActiveSession(session);
      setAnswerText('');
      setRecordSeconds(0);
      setIsRecording(false);
      setViewMode('PRACTICE');
      loadPastSessions();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize mock interview');
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      // Simulated speech-to-text live transcription demo if text is empty
      if (!answerText) {
        const activeQ = activeSession?.questions[activeSession.currentQuestionIndex];
        const starter =
          activeQ?.question.type === 'BEHAVIORAL'
            ? 'In my previous project, we faced a critical challenge with system scalability during peak hours. My responsibility was to identify bottlenecks and lead the architectural refactor. I implemented...'
            : 'To address this scenario, I would first analyze the core architectural bottlenecks. Specifically, I would evaluate the query execution plan, implement connection pooling, and configure...';
        setAnswerText(starter);
      }
    } else {
      setIsRecording(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!activeSession) return;
    const currentQ = activeSession.questions[activeSession.currentQuestionIndex];
    if (!currentQ) return;

    setLoading(true);
    setError(null);
    try {
      const updated = await submitInterviewAnswer(
        activeSession.id,
        {
          questionId: currentQ.questionId,
          responseText: answerText.trim() || 'No answer provided.',
          recordingDurationSeconds: recordSeconds || 45,
        },
        token
      );

      setActiveSession(updated);
      setAnswerText('');
      setRecordSeconds(0);
      setIsRecording(false);

      if (updated.status === 'COMPLETED') {
        handleGenerateReport(updated.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit response');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipQuestion = async () => {
    if (!activeSession) return;
    const currentQ = activeSession.questions[activeSession.currentQuestionIndex];
    if (!currentQ) return;

    setLoading(true);
    try {
      const updated = await skipInterviewQuestion(activeSession.id, currentQ.questionId, token);
      setActiveSession(updated);
      setAnswerText('');
      setRecordSeconds(0);
      setIsRecording(false);

      if (updated.status === 'COMPLETED') {
        handleGenerateReport(updated.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to skip question');
    } finally {
      setLoading(false);
    }
  };

  const handleAbandon = async () => {
    if (!activeSession) return;
    if (window.confirm('Are you sure you want to exit and abandon this mock interview session?')) {
      try {
        await abandonInterviewSession(activeSession.id, token);
      } catch (_) {}
      setActiveSession(null);
      setViewMode('CONFIG');
      loadPastSessions();
    }
  };

  const handleGenerateReport = async (sessionId: string) => {
    setEvaluating(true);
    setViewMode('REPORT');
    try {
      const rep = await evaluateInterviewSession(sessionId, token);
      setEvaluation(rep);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate interview report');
    } finally {
      setEvaluating(false);
      loadPastSessions();
    }
  };

  const handleViewPastReport = async (session: InterviewSession) => {
    setActiveSession(session);
    handleGenerateReport(session.id);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const activeQuestion =
    activeSession && activeSession.questions[activeSession.currentQuestionIndex]?.question;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-surface rounded-2xl p-6 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-primary px-2 py-0.5 rounded bg-accent-primary/10 border border-accent-primary/20">
              Phase 5 Active Engine
            </span>
            <span className="text-xs text-muted font-mono">STAR Method & Rubric Evaluator</span>
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight mt-1 flex items-center gap-2.5">
            <MessageSquare className="h-6 w-6 text-accent-primary" />
            AI Mock Interview Practice Room
          </h1>
          <p className="text-xs text-muted mt-1 max-w-2xl">
            Simulate realistic technical and behavioral interviews with structured rubrics, speech-to-text response capture, and instant STAR methodology feedback.
          </p>
        </div>

        {viewMode !== 'CONFIG' && (
          <button
            onClick={() => {
              setViewMode('CONFIG');
              setActiveSession(null);
              setEvaluation(null);
            }}
            className="flex items-center gap-2 bg-elevated hover:bg-border text-xs font-semibold px-4 py-2 rounded-lg border border-border transition-colors self-start md:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>New Practice Session</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-state-error/10 border border-state-error/30 text-state-error rounded-xl p-4 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="underline font-semibold ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW 1: CONFIGURATION & SETUP */}
      {viewMode === 'CONFIG' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface rounded-2xl p-6 border border-border space-y-6">
              <div>
                <h2 className="text-base font-bold text-primary flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent-primary" />
                  1. Select Target Domain Track
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Questions will be tailored to core competencies and roadmap skills for this role.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DOMAINS.map((dom) => {
                  const isSelected = selectedDomain === dom.slug;
                  return (
                    <div
                      key={dom.slug}
                      onClick={() => setSelectedDomain(dom.slug)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? `${dom.border} ${dom.bg} ring-2 ring-accent-primary/40`
                          : 'border-border bg-elevated/40 hover:border-muted/40 hover:bg-elevated'
                      }`}
                    >
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${dom.bg} ${dom.color}`}>
                        {dom.badge}
                      </span>
                      <h3 className="font-bold text-sm text-primary mt-2">{dom.title}</h3>
                      <p className="text-[11px] text-muted mt-1 leading-relaxed">{dom.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Session Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/60">
                <div>
                  <label className="text-xs font-semibold text-primary block mb-1.5">Difficulty Level</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as InterviewDifficulty)}
                    className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-primary focus:outline-none focus:border-accent-primary"
                  >
                    <option value="beginner">Beginner (Foundations)</option>
                    <option value="intermediate">Intermediate (Core Concepts)</option>
                    <option value="advanced">Advanced (Deep Architecture)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-primary block mb-1.5">Question Count</label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-primary focus:outline-none focus:border-accent-primary"
                  >
                    <option value={3}>3 Questions (Quick Prep ~10 min)</option>
                    <option value={4}>4 Questions (Standard ~15 min)</option>
                    <option value={6}>6 Questions (Full Mock ~25 min)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-primary mb-2">
                    <input
                      type="checkbox"
                      checked={includeBehavioral}
                      onChange={(e) => setIncludeBehavioral(e.target.checked)}
                      className="rounded border-border text-accent-primary focus:ring-0"
                    />
                    Include STAR Behavioral
                  </label>
                  <p className="text-[10px] text-muted">Evaluates Situation, Task, Action & Result</p>
                </div>
              </div>

              <button
                onClick={handleStartSession}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-accent-primary hover:bg-accent-primary/90 text-base font-bold text-sm py-3 rounded-xl transition-all shadow-lg shadow-accent-primary/10 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating Session Staging...
                  </span>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span>Enter Live Interview Practice Room</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Historical Sessions */}
          <div className="bg-surface rounded-2xl p-6 border border-border flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-base font-bold text-primary flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-accent-secondary" />
                Past Practice Sessions
              </h2>
              <p className="text-xs text-muted mt-0.5">Review previous mock evaluations and rubric scores.</p>

              <div className="mt-4 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {pastSessions.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-border rounded-xl">
                    <p className="text-xs text-muted">No mock interview history yet.</p>
                    <p className="text-[11px] text-muted/70 mt-1">Start your first session to receive rubric feedback.</p>
                  </div>
                ) : (
                  pastSessions.map((sess) => (
                    <div
                      key={sess.id}
                      onClick={() => handleViewPastReport(sess)}
                      className="p-3 bg-elevated/50 hover:bg-elevated border border-border rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                              sess.status === 'COMPLETED'
                                ? 'bg-state-success/10 text-state-success border border-state-success/30'
                                : 'bg-state-warning/10 text-state-warning border border-state-warning/30'
                            }`}
                          >
                            {sess.status}
                          </span>
                          <span className="text-[11px] text-muted font-mono">
                            {new Date(sess.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-primary mt-1 group-hover:text-accent-primary transition-colors">
                          {sess.title}
                        </h4>
                        <p className="text-[10px] text-muted mt-0.5">
                          {sess.answeredQuestions} of {sess.totalQuestions} answered
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-3.5 bg-accent-primary/5 border border-accent-primary/20 rounded-xl">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-accent-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted leading-relaxed">
                  <strong className="text-primary font-semibold">Invariant Reminder:</strong> Mock interview feedback enhances communication skills but does not automatically grant backend verified badges.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INTERACTIVE PRACTICE ROOM */}
      {viewMode === 'PRACTICE' && activeSession && activeQuestion && (
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="bg-surface rounded-2xl p-5 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center font-bold text-sm text-accent-primary">
                {activeSession.currentQuestionIndex + 1}/{activeSession.totalQuestions}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-elevated border border-border text-muted">
                    {activeQuestion.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono text-muted">{activeQuestion.skillId}</span>
                </div>
                <h3 className="text-sm font-bold text-primary mt-0.5">{activeSession.title}</h3>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="flex items-center gap-2 bg-elevated px-3 py-1.5 rounded-lg border border-border text-xs font-mono">
                <Clock className="h-3.5 w-3.5 text-accent-primary" />
                <span>Target: ~{formatSeconds(activeQuestion.expectedTimeSeconds)}</span>
              </div>
              <button
                onClick={handleAbandon}
                className="text-xs text-state-error/80 hover:text-state-error font-medium px-2 py-1 transition-colors"
              >
                Exit Session
              </button>
            </div>
          </div>

          {/* Question Prompt Card */}
          <div className="bg-gradient-to-br from-surface to-elevated/40 rounded-2xl p-6 border border-border shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-accent-primary uppercase tracking-wider">
                  Interview Question
                </span>
                <h2 className="text-xl font-bold text-primary mt-1 leading-snug">
                  {activeQuestion.prompt}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-elevated rounded-lg border border-border shrink-0">
                <Zap className="h-3 w-3 text-amber-400" />
                <span className="text-[11px] font-mono capitalize text-muted">{activeQuestion.difficulty}</span>
              </div>
            </div>

            {/* Rubric Hints / Outline */}
            <div className="p-4 bg-base/60 rounded-xl border border-border/80">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-accent-secondary" />
                Key Topics to Address in Your Answer
              </span>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted">
                {activeQuestion.rubric.idealAnswerOutline.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-accent-primary font-mono text-[11px]">0{idx + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Response Capture Area */}
          <div className="bg-surface rounded-2xl p-6 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-accent-primary" />
                Your Response (Spoken or Written)
              </label>

              {/* Voice simulation button */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isRecording
                    ? 'bg-state-error text-white animate-pulse shadow-lg shadow-state-error/20'
                    : 'bg-elevated hover:bg-border text-primary border border-border'
                }`}
              >
                {isRecording ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                <span>{isRecording ? `Recording (${formatSeconds(recordSeconds)})...` : 'Simulate Voice Input'}</span>
              </button>
            </div>

            <textarea
              rows={7}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Speak or type your structured response here. For behavioral questions, outline Situation, Task, Action, and Result. For technical deep dives, explain trade-offs and underlying mechanisms..."
              className="w-full bg-base border border-border rounded-xl p-4 text-sm text-primary placeholder-muted/50 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary font-sans leading-relaxed resize-y"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-muted font-mono">
                Words: {answerText.trim() ? answerText.trim().split(/\s+/).length : 0} | Duration: {formatSeconds(recordSeconds)}
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSkipQuestion}
                  disabled={loading}
                  className="w-1/2 sm:w-auto px-4 py-2 bg-elevated hover:bg-border border border-border text-xs font-semibold text-muted hover:text-primary rounded-xl transition-colors"
                >
                  Skip Question
                </button>
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={loading || !answerText.trim()}
                  className="w-1/2 sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-accent-primary hover:bg-accent-primary/90 text-base font-bold text-xs rounded-xl transition-all shadow-lg shadow-accent-primary/10 disabled:opacity-50"
                >
                  {loading ? (
                    'Submitting...'
                  ) : activeSession.currentQuestionIndex === activeSession.totalQuestions - 1 ? (
                    <>
                      <span>Complete & Evaluate</span>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Submit & Next Question</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: COMPREHENSIVE EVALUATION & STAR REPORT */}
      {viewMode === 'REPORT' && (
        <div className="space-y-6">
          {evaluating ? (
            <div className="p-16 text-center bg-surface rounded-2xl border border-border space-y-4">
              <div className="h-10 w-10 border-3 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <h3 className="text-base font-bold text-primary">Analyzing Interview Responses...</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Evaluating key signals, checking anti-patterns, and structuring STAR framework breakdowns.
              </p>
            </div>
          ) : evaluation ? (
            <div className="space-y-6">
              {/* Executive Summary Dial Card */}
              <div className="bg-surface rounded-2xl p-6 border border-border grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <div className="flex flex-col items-center justify-center p-4 bg-elevated/50 rounded-xl border border-border text-center">
                  <div className="relative flex items-center justify-center">
                    <span className="text-4xl font-extrabold text-accent-primary font-mono tracking-tight">
                      {evaluation.overallScore}%
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted mt-1">
                    Readiness Score
                  </span>
                  <span
                    className={`mt-2 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      evaluation.performanceTier === 'EXEMPLARY'
                        ? 'bg-state-success/10 text-state-success border border-state-success/30'
                        : evaluation.performanceTier === 'PROFICIENT'
                        ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/30'
                        : 'bg-state-warning/10 text-state-warning border border-state-warning/30'
                    }`}
                  >
                    {evaluation.performanceTier}
                  </span>
                </div>

                <div className="md:col-span-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-accent-secondary" />
                    <h3 className="text-base font-bold text-primary">Interview Performance Synthesis</h3>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{evaluation.summaryFeedback}</p>
                </div>
              </div>

              {/* Itemized Question Evaluations */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-state-success" />
                  Itemized Question & STAR Method Analysis
                </h3>

                {evaluation.questionEvaluations.map((qEval, idx) => (
                  <div key={idx} className="bg-surface rounded-2xl p-6 border border-border space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase text-accent-primary">
                          Question 0{idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-primary mt-0.5">{qEval.questionId}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold font-mono text-primary">{qEval.overallScore}%</span>
                        <p className="text-[10px] text-muted font-mono uppercase">{qEval.performanceTier}</p>
                      </div>
                    </div>

                    {/* Signals vs Missed */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-state-success/5 border border-state-success/20 rounded-xl">
                        <span className="text-[10px] font-mono font-bold text-state-success uppercase tracking-wider block mb-1.5">
                          ✓ Signals Demonstrated ({qEval.signalsDetected.length})
                        </span>
                        <ul className="space-y-1 text-xs text-muted">
                          {qEval.signalsDetected.length === 0 ? (
                            <li className="text-[11px] text-muted/60">No explicit signals matched</li>
                          ) : (
                            qEval.signalsDetected.map((sig, sIdx) => (
                              <li key={sIdx} className="flex items-start gap-1.5">
                                <span className="text-state-success font-bold">•</span>
                                <span>{sig}</span>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>

                      <div className="p-3 bg-state-warning/5 border border-state-warning/20 rounded-xl">
                        <span className="text-[10px] font-mono font-bold text-state-warning uppercase tracking-wider block mb-1.5">
                          ⚠ Missed Signals / Omissions ({qEval.missedSignals.length})
                        </span>
                        <ul className="space-y-1 text-xs text-muted">
                          {qEval.missedSignals.length === 0 ? (
                            <li className="text-[11px] text-state-success">All key signals covered!</li>
                          ) : (
                            qEval.missedSignals.map((sig, sIdx) => (
                              <li key={sIdx} className="flex items-start gap-1.5">
                                <span className="text-state-warning font-bold">•</span>
                                <span>{sig}</span>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* STAR Breakdown if behavioral */}
                    {qEval.starFeedback && (
                      <div className="p-4 bg-elevated/40 border border-border rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-accent-secondary" />
                            STAR Method Breakdown ({qEval.starFeedback.starCompletenessScore}% Complete)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                          {(['situation', 'task', 'action', 'result'] as const).map((pillarKey) => {
                            const p = qEval.starFeedback!.pillars[pillarKey];
                            return (
                              <div key={pillarKey} className="p-2.5 bg-surface border border-border/80 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono uppercase font-bold text-primary">
                                    {p.pillar}
                                  </span>
                                  <span
                                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                      p.presence === 'STRONG'
                                        ? 'bg-state-success/10 text-state-success'
                                        : p.presence === 'ADEQUATE'
                                        ? 'bg-accent-primary/10 text-accent-primary'
                                        : 'bg-state-warning/10 text-state-warning'
                                    }`}
                                  >
                                    {p.presence}
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted mt-1 leading-tight">{p.feedback}</p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Reformulated Story Box */}
                        <div className="p-3 bg-base/80 border border-border rounded-lg text-xs font-sans text-muted leading-relaxed whitespace-pre-line">
                          {qEval.starFeedback.structuredReformulation}
                        </div>
                      </div>
                    )}

                    {/* Strengths & Improvement Tips */}
                    <div className="space-y-1.5 text-xs">
                      {qEval.strengths.map((str, sIdx) => (
                        <p key={sIdx} className="text-state-success flex items-center gap-1.5">
                          <span className="font-bold">+</span> {str}
                        </p>
                      ))}
                      {qEval.areasForImprovement.map((imp, iIdx) => (
                        <p key={iIdx} className="text-muted flex items-center gap-1.5">
                          <span className="text-accent-primary font-bold">→</span> {imp}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Bridge: Back to Roadmap or New Session */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-surface rounded-2xl border border-border">
                <div>
                  <h4 className="font-bold text-sm text-primary">Bridge to Roadmap Learning</h4>
                  <p className="text-xs text-muted mt-0.5">Study missing concepts and verify skills in the timed assessment.</p>
                </div>
                <div className="flex items-center gap-3">
                  {onNavigateToRoadmap && (
                    <button
                      onClick={() => onNavigateToRoadmap(selectedDomain)}
                      className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-primary/90 text-base font-semibold text-xs rounded-xl transition-colors"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Review Roadmap Modules</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setViewMode('CONFIG');
                      setActiveSession(null);
                      setEvaluation(null);
                    }}
                    className="px-4 py-2 bg-elevated hover:bg-border text-xs font-semibold rounded-xl border border-border transition-colors"
                  >
                    Practice Another Mock
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

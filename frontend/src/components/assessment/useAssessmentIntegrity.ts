import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AssessmentIntegrityReport,
  IntegritySignalEvent,
  IntegrityEventType,
} from '../../lib/assessmentApi';

interface UseAssessmentIntegrityProps {
  isActive: boolean;
  currentQuestionIndex?: number;
}

export interface UseAssessmentIntegrityReturn {
  integrityReport: AssessmentIntegrityReport;
  lastViolation: IntegritySignalEvent | null;
  warningMessage: string | null;
  dismissWarning: () => void;
  recordEvent: (eventType: IntegrityEventType, details?: string) => void;
  resetIntegrity: () => void;
  toggleFullscreen: () => Promise<void>;
  isFullscreen: boolean;
}

export function useAssessmentIntegrity({
  isActive,
  currentQuestionIndex = 0,
}: UseAssessmentIntegrityProps): UseAssessmentIntegrityReturn {
  const [events, setEvents] = useState<IntegritySignalEvent[]>([]);
  const [tabSwitchesCount, setTabSwitchesCount] = useState(0);
  const [focusLossCount, setFocusLossCount] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [clipboardActionsCount, setClipboardActionsCount] = useState(0);
  const [lastViolation, setLastViolation] = useState<IntegritySignalEvent | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const blurStartTimeRef = useRef<number | null>(null);
  const isEnteringFullscreenRef = useRef<boolean>(false);

  const calculateScore = useCallback(
    (tabs: number, focusLoss: number, fsExits: number, clip: number) => {
      let score = 100;
      score -= tabs * 15;
      score -= focusLoss * 15;
      score -= fsExits * 20;
      score -= clip * 10;
      return Math.max(0, Math.min(100, score));
    },
    []
  );

  const currentScore = calculateScore(
    tabSwitchesCount,
    focusLossCount,
    fullscreenExitCount,
    clipboardActionsCount
  );
  const isFlagged = tabSwitchesCount > 3 || currentScore < 60;

  const recordEvent = useCallback(
    (eventType: IntegrityEventType, details?: string, durationMs?: number) => {
      const newEvent: IntegritySignalEvent = {
        id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        eventType,
        timestamp: new Date().toISOString(),
        durationMs,
        questionIndex: currentQuestionIndex,
        details,
      };

      setEvents((prev) => [...prev, newEvent]);
      setLastViolation(newEvent);

      if (eventType === 'TAB_SWITCH') {
        setTabSwitchesCount((prev) => {
          const next = prev + 1;
          if (next > 3) {
            setWarningMessage(
              `Critical Warning: You switched tabs ${next} times. Proctoring limit (3) exceeded; this attempt will be flagged.`
            );
          } else {
            setWarningMessage(
              `Integrity Notice: Tab switch detected (${next}/3 allowed). Please stay focused on the assessment.`
            );
          }
          return next;
        });
      } else if (eventType === 'FOCUS_LOST') {
        setFocusLossCount((prev) => {
          const next = prev + 1;
          setWarningMessage(`Integrity Notice: Window focus lost. Please do not navigate away.`);
          return next;
        });
      } else if (eventType === 'FULLSCREEN_EXIT') {
        setFullscreenExitCount((prev) => {
          const next = prev + 1;
          setWarningMessage(`Integrity Notice: Fullscreen mode exited.`);
          return next;
        });
      } else if (eventType === 'CLIPBOARD_COPY' || eventType === 'CLIPBOARD_PASTE') {
        setClipboardActionsCount((prev) => {
          const next = prev + 1;
          setWarningMessage(`Integrity Notice: Clipboard action (${eventType}) recorded.`);
          return next;
        });
      }
    },
    [currentQuestionIndex]
  );

  const dismissWarning = useCallback(() => {
    setWarningMessage(null);
  }, []);

  const resetIntegrity = useCallback(() => {
    setEvents([]);
    setTabSwitchesCount(0);
    setFocusLossCount(0);
    setFullscreenExitCount(0);
    setClipboardActionsCount(0);
    setLastViolation(null);
    setWarningMessage(null);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        isEnteringFullscreenRef.current = true;
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen might be blocked by browser permissions
    } finally {
      setTimeout(() => {
        isEnteringFullscreenRef.current = false;
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        blurStartTimeRef.current = Date.now();
        recordEvent('TAB_SWITCH', 'Candidate switched to another tab or minimized window');
      } else if (blurStartTimeRef.current) {
        const duration = Date.now() - blurStartTimeRef.current;
        blurStartTimeRef.current = null;
        recordEvent('FOCUS_LOST', `Focus returned after ${Math.round(duration / 1000)}s away`, duration);
      }
    };

    const handleWindowBlur = () => {
      if (!document.hidden) {
        blurStartTimeRef.current = Date.now();
        recordEvent('FOCUS_LOST', 'Window focus lost to another desktop application');
      }
    };

    const handleWindowFocus = () => {
      if (blurStartTimeRef.current) {
        blurStartTimeRef.current = null;
      }
    };

    const handleFullscreenChange = () => {
      const fsElement = document.fullscreenElement;
      setIsFullscreen(Boolean(fsElement));
      if (!fsElement && !isEnteringFullscreenRef.current) {
        recordEvent('FULLSCREEN_EXIT', 'Exited fullscreen assessment mode');
      }
    };

    const handleCopy = () => {
      recordEvent('CLIPBOARD_COPY', 'Candidate copied text during assessment');
    };

    const handlePaste = () => {
      recordEvent('CLIPBOARD_PASTE', 'Candidate pasted external text into assessment');
    };

    const handleContextMenu = () => {
      recordEvent('CONTEXT_MENU', 'Candidate opened context menu');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isActive, recordEvent]);

  const integrityReport: AssessmentIntegrityReport = {
    integrityScore: currentScore,
    totalViolations: events.length,
    tabSwitchesCount,
    focusLossCount,
    fullscreenExitCount,
    clipboardActionsCount,
    flaggedForReview: isFlagged,
    events,
  };

  return {
    integrityReport,
    lastViolation,
    warningMessage,
    dismissWarning,
    recordEvent,
    resetIntegrity,
    toggleFullscreen,
    isFullscreen,
  };
}

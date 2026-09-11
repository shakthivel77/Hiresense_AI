import React, { useMemo } from 'react';
import {
  VisualizerNode,
  DomainMasterySummary,
  HighlightFilterMode,
  NodeProfileStats,
} from './types';
import {
  Award,
  CheckCircle2,
  Unlock,
  Lock,
  Clock,
  PlayCircle,
  AlertTriangle,
  X,
  Zap,
} from 'lucide-react';

interface SkillProfileOverlayProps {
  nodes: VisualizerNode[];
  selectedNode: VisualizerNode | null;
  activeFilter: HighlightFilterMode;
  onFilterChange: (mode: HighlightFilterMode) => void;
  onLaunchAssessment?: (skillId: string, skillName: string) => void;
  onSimulateUnlock?: (skillId: string) => void;
  onCloseInspector?: () => void;
  className?: string;
}

export const SkillProfileOverlay: React.FC<SkillProfileOverlayProps> = ({
  nodes,
  selectedNode,
  activeFilter,
  onFilterChange,
  onLaunchAssessment,
  onSimulateUnlock,
  onCloseInspector,
  className = '',
}) => {
  // 1. Calculate domain-wide mastery metrics
  const masterySummary: DomainMasterySummary = useMemo(() => {
    const totalSkills = nodes.length;
    let verifiedCount = 0;
    let availableCount = 0;
    let inProgressCount = 0;
    let lockedCount = 0;
    let totalScore = 0;
    let scoredCount = 0;

    nodes.forEach((n) => {
      switch (n.status) {
        case 'verified':
          verifiedCount++;
          if (n.verificationScore != null) {
            totalScore += Number(n.verificationScore);
            scoredCount++;
          }
          break;
        case 'available':
          availableCount++;
          break;
        case 'in_progress':
          inProgressCount++;
          break;
        case 'locked':
        default:
          lockedCount++;
          break;
      }
    });

    const masteryPercentage = totalSkills > 0 ? Math.round((verifiedCount / totalSkills) * 100) : 0;
    const averageVerificationScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

    return {
      totalSkills,
      verifiedCount,
      availableCount,
      inProgressCount,
      lockedCount,
      masteryPercentage,
      averageVerificationScore,
    };
  }, [nodes]);

  // 2. Calculate selected node profile statistics
  const selectedNodeStats: NodeProfileStats | null = useMemo(() => {
    if (!selectedNode) return null;

    const nodeMap = new Map<string, VisualizerNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const missingPrereqNames: string[] = [];
    (selectedNode.prerequisites || []).forEach((prereqId) => {
      const prereq = nodeMap.get(prereqId);
      if (prereq && prereq.status !== 'verified') {
        missingPrereqNames.push(prereq.name);
      }
    });

    const attemptCount = selectedNode.attemptCount || 0;
    const maxAttempts = 3;
    const isReadyForAssessment =
      (selectedNode.status === 'available' || selectedNode.status === 'in_progress') &&
      attemptCount < maxAttempts;

    return {
      skillId: selectedNode.id,
      status: selectedNode.status,
      verificationScore: selectedNode.verificationScore,
      attemptCount,
      maxAttempts,
      lastAttemptAt: selectedNode.lastAttemptAt,
      isReadyForAssessment,
      missingPrereqNames,
    };
  }, [selectedNode, nodes]);

  const filterButtons: { id: HighlightFilterMode; label: string; count: number; color: string }[] = [
    { id: 'all', label: 'All', count: masterySummary.totalSkills, color: 'text-primary' },
    { id: 'verified_only', label: 'Verified', count: masterySummary.verifiedCount, color: 'text-state-success' },
    { id: 'available_only', label: 'Available', count: masterySummary.availableCount, color: 'text-accent-primary' },
    { id: 'missing_prereqs', label: 'Missing Prereqs', count: nodes.filter((n) => n.status === 'locked' && n.prerequisites.length > 0).length, color: 'text-state-warning' },
  ];

  return (
    <div className={`space-y-3 pointer-events-auto ${className}`}>
      {/* Top HUD: Domain Mastery & Filters */}
      <div className="bg-surface/90 backdrop-blur-md border border-border rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Mastery Progress */}
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center h-12 w-12 rounded-xl bg-elevated border border-border/80">
            <Award className="h-6 w-6 text-accent-primary" />
            <span className="absolute -bottom-1 -right-1 bg-accent-primary text-[9px] font-mono font-bold text-base px-1 rounded-full">
              {masterySummary.masteryPercentage}%
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-primary">Domain Competency</h3>
              <span className="text-[11px] font-mono text-muted">
                {masterySummary.verifiedCount} of {masterySummary.totalSkills} Verified
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-48 sm:w-64 h-2 bg-base rounded-full overflow-hidden mt-1.5 border border-border/50">
              <div
                style={{ width: `${masterySummary.masteryPercentage}%` }}
                className="h-full bg-gradient-to-r from-accent-primary to-state-success transition-all duration-500 rounded-full"
              />
            </div>
          </div>

          {masterySummary.averageVerificationScore > 0 && (
            <div className="hidden sm:flex flex-col border-l border-border pl-4">
              <span className="text-[10px] uppercase font-mono text-muted">Avg Score</span>
              <span className="text-sm font-bold font-mono text-state-success">
                {masterySummary.averageVerificationScore}%
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Highlight Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {filterButtons.map((btn) => {
            const isActive = activeFilter === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => onFilterChange(btn.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-accent-primary text-base font-bold shadow-md shadow-accent-primary/20'
                    : 'bg-elevated hover:bg-elevated/80 text-muted hover:text-primary border border-border/60'
                }`}
              >
                <span>{btn.label}</span>
                <span className={`text-[10px] font-mono opacity-80 ${isActive ? 'text-base' : btn.color}`}>
                  ({btn.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Node Profile Drawer */}
      {selectedNode && selectedNodeStats && (
        <div className="bg-surface/95 backdrop-blur-md border border-accent-primary/40 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  selectedNode.status === 'verified'
                    ? 'bg-state-success/10 border-state-success/40 text-state-success'
                    : selectedNode.status === 'available'
                    ? 'bg-accent-primary/10 border-accent-primary/40 text-accent-primary'
                    : selectedNode.status === 'in_progress'
                    ? 'bg-state-warning/10 border-state-warning/40 text-state-warning'
                    : 'bg-elevated border-border text-muted'
                }`}
              >
                {selectedNode.status === 'verified' && <CheckCircle2 className="h-5 w-5" />}
                {selectedNode.status === 'available' && <Unlock className="h-5 w-5" />}
                {selectedNode.status === 'in_progress' && <Clock className="h-5 w-5" />}
                {selectedNode.status === 'locked' && <Lock className="h-5 w-5" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-bold">
                    {selectedNode.category}
                  </span>
                  <span className="text-[10px] font-mono capitalize text-muted/80 px-1.5 py-0.5 rounded bg-elevated border border-border">
                    {selectedNode.difficulty}
                  </span>
                </div>
                <h4 className="text-base font-bold text-primary mt-0.5">{selectedNode.name}</h4>
              </div>
            </div>

            {onCloseInspector && (
              <button
                onClick={onCloseInspector}
                className="p-1 hover:bg-elevated text-muted hover:text-primary rounded-lg transition-colors"
                title="Close Inspector"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-border/60 text-xs">
            <div className="bg-base/60 p-2.5 rounded-xl border border-border/40">
              <span className="text-[10px] font-mono text-muted uppercase">Status</span>
              <p
                className={`font-bold capitalize mt-0.5 ${
                  selectedNode.status === 'verified'
                    ? 'text-state-success'
                    : selectedNode.status === 'available'
                    ? 'text-accent-primary'
                    : selectedNode.status === 'in_progress'
                    ? 'text-state-warning'
                    : 'text-muted'
                }`}
              >
                {selectedNode.status.replace('_', ' ')}
              </p>
            </div>

            <div className="bg-base/60 p-2.5 rounded-xl border border-border/40">
              <span className="text-[10px] font-mono text-muted uppercase">Verification</span>
              <p className="font-bold font-mono text-primary mt-0.5">
                {selectedNodeStats.verificationScore != null
                  ? `${selectedNodeStats.verificationScore}%`
                  : 'Unverified'}
              </p>
            </div>

            <div className="bg-base/60 p-2.5 rounded-xl border border-border/40">
              <span className="text-[10px] font-mono text-muted uppercase">Monthly Attempts</span>
              <p className="font-bold font-mono text-primary mt-0.5">
                {selectedNodeStats.attemptCount} / {selectedNodeStats.maxAttempts}
              </p>
            </div>

            <div className="bg-base/60 p-2.5 rounded-xl border border-border/40">
              <span className="text-[10px] font-mono text-muted uppercase">Prerequisites</span>
              <p className="font-bold font-mono text-primary mt-0.5">
                {selectedNode.prerequisites.length - selectedNodeStats.missingPrereqNames.length} /{' '}
                {selectedNode.prerequisites.length} Satisfied
              </p>
            </div>
          </div>

          {/* Missing Prerequisites Warning */}
          {selectedNodeStats.missingPrereqNames.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-state-warning/10 border border-state-warning/30 flex items-start gap-2 text-xs text-state-warning">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Missing Prerequisites:</span>{' '}
                {selectedNodeStats.missingPrereqNames.join(', ')}. Pass these assessments first to unlock this skill.
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
            <div className="flex items-center gap-2">
              {onSimulateUnlock && (
                <button
                  onClick={() => onSimulateUnlock(selectedNode.id)}
                  className="flex items-center gap-1.5 text-xs bg-elevated hover:bg-elevated/80 text-muted hover:text-primary px-3 py-1.5 rounded-lg border border-border transition-colors font-medium"
                >
                  <Zap className="h-3.5 w-3.5 text-accent-secondary" />
                  <span>Simulate Unlock</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedNodeStats.isReadyForAssessment && onLaunchAssessment && (
                <button
                  onClick={() => onLaunchAssessment(selectedNode.id, selectedNode.name)}
                  className="flex items-center gap-1.5 text-xs bg-accent-primary hover:bg-accent-primary/90 text-base font-bold px-4 py-1.5 rounded-lg shadow-md shadow-accent-primary/20 transition-all"
                >
                  <PlayCircle className="h-4 w-4" />
                  <span>Launch Assessment</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

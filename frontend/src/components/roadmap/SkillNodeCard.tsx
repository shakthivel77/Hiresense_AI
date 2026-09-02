import React from 'react';
import { SkillGraphNode, SkillStatus, SkillDifficulty } from '../../types/roadmap';
import { Lock, CheckCircle2, PlayCircle, Clock, ArrowRight, Layers } from 'lucide-react';

interface SkillNodeCardProps {
  node: SkillGraphNode;
  allNodes: SkillGraphNode[];
  onSelect: (node: SkillGraphNode) => void;
  statusOverride?: SkillStatus;
}

export const SkillNodeCard: React.FC<SkillNodeCardProps> = ({
  node,
  allNodes,
  onSelect,
  statusOverride,
}) => {
  const { skill, prerequisiteSkillIds, dependentSkillIds } = node;

  // Determine status (prioritizing userStatus from backend skill engine)
  const status: SkillStatus =
    statusOverride ||
    node.userStatus ||
    node.status ||
    (prerequisiteSkillIds.length === 0 ? 'available' : 'locked');

  const getDifficultyBadge = (difficulty: SkillDifficulty) => {
    switch (difficulty) {
      case 'beginner':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Beginner
          </span>
        );
      case 'intermediate':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Intermediate
          </span>
        );
      case 'advanced':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Advanced
          </span>
        );
    }
  };

  const getStatusBadge = (st: SkillStatus) => {
    switch (st) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-state-success/15 text-state-success border border-state-success/30">
            <CheckCircle2 className="h-3.5 w-3.5" />
            VERIFIED
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/30">
            <Clock className="h-3.5 w-3.5" />
            IN PROGRESS
          </span>
        );
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-accent-primary/15 text-accent-primary border border-accent-primary/30">
            <PlayCircle className="h-3.5 w-3.5" />
            AVAILABLE
          </span>
        );
      case 'locked':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-state-locked/15 text-state-locked border border-state-locked/30">
            <Lock className="h-3.5 w-3.5" />
            LOCKED
          </span>
        );
    }
  };

  // Find prerequisite names for quick preview
  const prereqNames = prerequisiteSkillIds
    .map((id) => allNodes.find((n) => n.skill.id === id)?.skill.name)
    .filter(Boolean) as string[];

  const isLocked = status === 'locked';

  return (
    <div
      onClick={() => onSelect(node)}
      className={`group cursor-pointer rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between ${
        isLocked
          ? 'bg-surface/60 border-border/60 hover:border-border hover:bg-surface opacity-80'
          : status === 'verified'
          ? 'bg-elevated border-state-success/40 shadow-sm hover:border-state-success'
          : 'bg-surface border-border hover:border-accent-primary/60 hover:bg-elevated shadow-sm'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            {getDifficultyBadge(skill.difficulty)}
            <span className="text-[10px] uppercase font-mono tracking-wider text-muted px-2 py-0.5 rounded bg-base border border-border">
              {skill.category}
            </span>
          </div>
          {getStatusBadge(status)}
        </div>

        <h4 className="text-sm font-semibold text-primary group-hover:text-accent-primary transition-colors flex items-center justify-between">
          <span>{skill.name}</span>
          <ArrowRight className="h-4 w-4 text-muted group-hover:text-accent-primary transition-transform group-hover:translate-x-0.5" />
        </h4>

        {skill.description && (
          <p className="text-xs text-muted mt-1.5 line-clamp-2 leading-relaxed">
            {skill.description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted font-mono">
        <div className="flex items-center gap-1">
          <Layers className="h-3 w-3 text-muted" />
          <span>
            {prerequisiteSkillIds.length === 0
              ? 'Foundation Skill'
              : `${prerequisiteSkillIds.length} Prereq${prerequisiteSkillIds.length > 1 ? 's' : ''}`}
          </span>
        </div>

        {prereqNames.length > 0 && isLocked && (
          <span className="text-state-warning truncate max-w-[130px]" title={`Requires: ${prereqNames.join(', ')}`}>
            Req: {prereqNames[0]}
            {prereqNames.length > 1 ? ` +${prereqNames.length - 1}` : ''}
          </span>
        )}

        {dependentSkillIds.length > 0 && (
          <span className="text-muted">
            Unlocks {dependentSkillIds.length}
          </span>
        )}
      </div>
    </div>
  );
};

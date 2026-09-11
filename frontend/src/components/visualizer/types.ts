import { SkillStatus, SkillDifficulty } from '../../types/roadmap';

export interface VisualizerNode {
  id: string;
  skillId: string;
  slug: string;
  name: string;
  category: string;
  difficulty: SkillDifficulty;
  status: SkillStatus;
  verificationScore?: number | null;
  attemptCount?: number;
  lastAttemptAt?: string | null;
  prerequisites: string[];
  dependents: string[];
  // Layout coordinates
  x: number;
  y: number;
  width: number;
  height: number;
  layer: number;
  // Interaction flags
  isSelected?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  isPrerequisiteOfSelected?: boolean;
  isMissingPrerequisite?: boolean;
  isDependentOfSelected?: boolean;
  isInLearningPath?: boolean;
}

export interface VisualizerEdge {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePos: { x: number; y: number };
  targetPos: { x: number; y: number };
  pathData: string;
  isHighlighted?: boolean;
  isPrereqHighlight?: boolean;
  isDependentHighlight?: boolean;
  isDimmed?: boolean;
  isUnlockPath?: boolean;
}

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export interface LayoutBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  direction?: 'LR' | 'TB';
}

export interface TraversalHighlightState {
  selectedNodeId: string | null;
  prerequisiteNodeIds: Set<string>;
  missingPrerequisiteNodeIds: Set<string>;
  prerequisiteEdgeIds: Set<string>;
  dependentNodeIds: Set<string>;
  dependentEdgeIds: Set<string>;
  unlockedEdgeIds: Set<string>;
}

export interface UnlockSimulationResult {
  simulatedSkillIds: string[];
  newlyUnlockedSkillIds: string[];
  alreadyAvailableOrVerifiedSkillIds: string[];
  stillLockedSkillIds: string[];
}

export interface LearningStep {
  skillId: string;
  name: string;
  status: SkillStatus;
  difficulty: SkillDifficulty;
  layer: number;
  isMissing: boolean;
}

export interface LearningPathResult {
  targetSkillId: string;
  targetSkillName: string;
  isAlreadyVerified: boolean;
  totalSteps: number;
  missingStepsCount: number;
  steps: LearningStep[];
  edgeIdsInPath: string[];
}

export interface DomainMasterySummary {
  totalSkills: number;
  verifiedCount: number;
  availableCount: number;
  inProgressCount: number;
  lockedCount: number;
  masteryPercentage: number;
  averageVerificationScore: number;
}

export type HighlightFilterMode =
  | 'all'
  | 'verified_only'
  | 'available_only'
  | 'missing_prereqs'
  | 'unlocked_next';

export interface ProfileOverlayFilter {
  highlightMode: HighlightFilterMode;
  searchQuery: string;
}

export interface NodeProfileStats {
  skillId: string;
  status: SkillStatus;
  verificationScore?: number | null;
  attemptCount: number;
  maxAttempts: number;
  lastAttemptAt?: string | null;
  isReadyForAssessment: boolean;
  missingPrereqNames: string[];
}

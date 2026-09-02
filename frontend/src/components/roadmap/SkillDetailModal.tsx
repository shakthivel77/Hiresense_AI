import React, { useState, useEffect } from 'react';
import { SkillGraphNode, SkillStatus } from '../../types/roadmap';
import { ResourceDTO, fetchSkillResources } from '../../lib/resourcesApi';
import { claimSkill } from '../../lib/roadmapApi';
import { fetchSkillAttemptStatus, SkillAttemptStatusDTO } from '../../lib/assessmentApi';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Shield,
  BookOpen,
  Lock,
  CheckCircle2,
  PlayCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Layers,
  AlertTriangle,
  FileText,
  Video,
  Bookmark,
  Check,
  Calendar,
} from 'lucide-react';

interface SkillDetailModalProps {
  node: SkillGraphNode | null;
  allNodes: SkillGraphNode[];
  onClose: () => void;
  onSelectPrereqNode?: (prereqNode: SkillGraphNode) => void;
  onSkillClaimed?: () => void;
  onStartAssessment?: (node: SkillGraphNode) => void;
}

type TabType = 'overview' | 'resources' | 'assessment';

export const SkillDetailModal: React.FC<SkillDetailModalProps> = ({
  node,
  allNodes,
  onClose,
  onSelectPrereqNode,
  onSkillClaimed,
  onStartAssessment,
}) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [resources, setResources] = useState<ResourceDTO[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [attemptStatus, setAttemptStatus] = useState<SkillAttemptStatusDTO | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Fetch learning resources and attempt status when node changes
  useEffect(() => {
    if (!node) return;
    setActiveTab('overview');
    setClaimSuccess(false);
    let isMounted = true;
    setLoadingResources(true);

    fetchSkillResources(node.skill.slug)
      .then((data) => {
        if (isMounted) {
          setResources(data);
          setLoadingResources(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setResources([]);
          setLoadingResources(false);
        }
      });

    if (token) {
      fetchSkillAttemptStatus(node.skill.id, token)
        .then((status) => {
          if (isMounted) setAttemptStatus(status);
        })
        .catch(() => {
          if (isMounted) setAttemptStatus(null);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [node, token]);

  if (!node) return null;

  const { skill, prerequisiteSkillIds, dependentSkillIds, userSkillRecord } = node;

  const status: SkillStatus =
    node.userStatus || node.status || (prerequisiteSkillIds.length === 0 ? 'available' : 'locked');
  const isLocked = status === 'locked';
  const isVerified = status === 'verified';

  const prerequisiteNodes = prerequisiteSkillIds
    .map((id) => allNodes.find((n) => n.skill.id === id))
    .filter((n): n is SkillGraphNode => Boolean(n));

  const dependentNodes = dependentSkillIds
    .map((id) => allNodes.find((n) => n.skill.id === id))
    .filter((n): n is SkillGraphNode => Boolean(n));

  const handleClaim = async () => {
    if (!token) {
      alert('Please sign in to declare or claim skills.');
      return;
    }
    try {
      setClaiming(true);
      await claimSkill(skill.id, token);
      setClaimSuccess(true);
      if (onSkillClaimed) onSkillClaimed();
    } catch (err: any) {
      alert(err.message || 'Failed to claim skill');
    } finally {
      setClaiming(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4 text-rose-400" />;
      case 'tutorial':
        return <PlayCircle className="h-4 w-4 text-accent-secondary" />;
      case 'documentation':
      default:
        return <FileText className="h-4 w-4 text-accent-primary" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-border bg-elevated/40">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase font-mono tracking-wider px-2.5 py-0.5 rounded bg-base text-muted border border-border">
                  {skill.category}
                </span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/20 capitalize">
                  {skill.difficulty}
                </span>
                {userSkillRecord && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-elevated text-primary border border-border">
                    Record: {userSkillRecord.status}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-primary">{skill.name}</h3>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-muted hover:text-primary rounded-lg hover:bg-elevated transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-border/60">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-elevated text-accent-primary border border-accent-primary/30'
                  : 'text-muted hover:text-primary hover:bg-elevated/40'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Overview & Prerequisites</span>
            </button>

            <button
              onClick={() => setActiveTab('resources')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'resources'
                  ? 'bg-elevated text-accent-primary border border-accent-primary/30'
                  : 'text-muted hover:text-primary hover:bg-elevated/40'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Learning Resources ({resources.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('assessment')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'assessment'
                  ? 'bg-elevated text-accent-primary border border-accent-primary/30'
                  : 'text-muted hover:text-primary hover:bg-elevated/40'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Assessment Readiness</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Status Alert */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  status === 'verified'
                    ? 'bg-state-success/10 border-state-success/30 text-state-success'
                    : status === 'available'
                    ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary'
                    : status === 'in_progress'
                    ? 'bg-accent-secondary/10 border-accent-secondary/30 text-accent-secondary'
                    : 'bg-state-locked/10 border-state-locked/30 text-state-locked'
                }`}
              >
                {status === 'verified' ? (
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                ) : status === 'available' ? (
                  <PlayCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                ) : status === 'in_progress' ? (
                  <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <Lock className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <h4 className="font-semibold text-sm">
                    Status:{' '}
                    {status === 'verified'
                      ? 'Verified Competency'
                      : status === 'available'
                      ? 'Available to Learn & Assess'
                      : status === 'in_progress'
                      ? 'In Progress (Active Learner)'
                      : 'Locked by Prerequisites'}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
                    {status === 'verified'
                      ? 'Verified by backend assessment (Score >= 80%). Unlocks downstream roadmap skills.'
                      : status === 'available'
                      ? 'All prerequisites verified. You can study curated resources or take the verification assessment.'
                      : status === 'in_progress'
                      ? 'You have active learning resources or a previous assessment attempt.'
                      : 'Requires verifying all prerequisite skills below before this skill unlocks.'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Skill Description
                </h4>
                <p className="text-sm text-primary leading-relaxed bg-base/50 p-4 rounded-xl border border-border">
                  {skill.description || 'Core technical competency in the software engineering domain roadmap.'}
                </p>
              </div>

              {/* Prerequisite Chain */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5 flex items-center justify-between">
                  <span>Prerequisites ({prerequisiteNodes.length})</span>
                  {prerequisiteNodes.length === 0 && (
                    <span className="text-[11px] text-state-success font-mono">✦ Foundation Skill</span>
                  )}
                </h4>

                {prerequisiteNodes.length === 0 ? (
                  <p className="text-xs text-muted font-mono bg-base/40 p-3 rounded-lg border border-border">
                    This is an entry-level foundation skill. No prior prerequisites are required.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {prerequisiteNodes.map((prereq) => (
                      <div
                        key={prereq.skill.id}
                        onClick={() => onSelectPrereqNode && onSelectPrereqNode(prereq)}
                        className="flex items-center justify-between p-3 rounded-lg bg-base/80 border border-border hover:border-accent-primary/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Lock className="h-4 w-4 text-state-locked" />
                          <div>
                            <p className="text-xs font-semibold text-primary">{prereq.skill.name}</p>
                            <p className="text-[10px] text-muted font-mono">{prereq.skill.category} • {prereq.skill.difficulty}</p>
                          </div>
                        </div>
                        <span className="text-[11px] text-accent-primary flex items-center gap-1 font-medium">
                          Inspect <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Unlocked Dependent Skills */}
              {dependentNodes.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
                    Unlocks Upon Verification ({dependentNodes.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {dependentNodes.map((dep) => (
                      <div
                        key={dep.skill.id}
                        className="p-3 rounded-lg bg-base/50 border border-border text-xs"
                      >
                        <p className="font-semibold text-primary">{dep.skill.name}</p>
                        <p className="text-[10px] text-muted font-mono mt-0.5">{dep.skill.difficulty}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-primary">Curated Learning Materials</h4>
                  <p className="text-xs text-muted">Study free documentation, guides, and practical tutorials.</p>
                </div>
                <span className="text-xs font-mono text-muted">{resources.length} Available</span>
              </div>

              {loadingResources ? (
                <div className="p-8 text-center bg-base/50 rounded-xl border border-border">
                  <Clock className="h-5 w-5 text-accent-primary animate-spin mx-auto mb-2" />
                  <p className="text-xs text-muted font-mono">Loading curated materials...</p>
                </div>
              ) : resources.length > 0 ? (
                <div className="space-y-3">
                  {resources.map((res) => (
                    <a
                      key={res.id}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-4 rounded-xl bg-base/60 hover:bg-elevated border border-border hover:border-accent-primary/60 transition-all flex items-start justify-between gap-4 block"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-surface rounded-lg border border-border mt-0.5">
                          {getResourceIcon(res.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface text-muted border border-border">
                              {res.source}
                            </span>
                            <span className="text-[10px] font-mono capitalize px-2 py-0.5 rounded bg-accent-primary/10 text-accent-primary">
                              {res.type}
                            </span>
                          </div>
                          <h5 className="text-xs font-semibold text-primary group-hover:text-accent-primary transition-colors flex items-center gap-1.5">
                            {res.title}
                          </h5>
                          {res.description && (
                            <p className="text-xs text-muted mt-1 leading-relaxed">
                              {res.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <ExternalLink className="h-4 w-4 text-muted group-hover:text-accent-primary transition-transform group-hover:translate-x-0.5 flex-shrink-0 mt-1" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-base/40 rounded-xl border border-border">
                  <p className="text-xs text-muted">No external resources cataloged for this skill yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'assessment' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-base border border-border space-y-3">
                <div className="flex items-center gap-2 text-accent-primary font-semibold text-sm">
                  <Shield className="h-4 w-4" />
                  <span>Assessment Structure & Verification Rules</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-mono">
                  <div className="p-2.5 bg-surface rounded-lg border border-border">
                    <span className="text-primary font-bold text-sm block">15 Min</span>
                    <span className="text-[10px] text-muted">Duration</span>
                  </div>
                  <div className="p-2.5 bg-surface rounded-lg border border-border">
                    <span className="text-primary font-bold text-sm block">10</span>
                    <span className="text-[10px] text-muted">Questions</span>
                  </div>
                  <div className="p-2.5 bg-surface rounded-lg border border-border">
                    <span className="text-state-success font-bold text-sm block">&gt;= 80%</span>
                    <span className="text-[10px] text-muted">Pass Mark</span>
                  </div>
                  <div className="p-2.5 bg-surface rounded-lg border border-border">
                    <span className="text-state-warning font-bold text-sm block">3 / Mo</span>
                    <span className="text-[10px] text-muted">Attempt Limit</span>
                  </div>
                </div>
              </div>

              {/* Monthly Attempt Limit Tracker */}
              <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-accent-primary" />
                    <span className="text-xs font-semibold text-primary">Monthly Attempt Tracker</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-accent-primary">
                    {attemptStatus ? `${attemptStatus.attemptsRemaining} of 3 remaining` : '3 of 3 remaining'}
                  </span>
                </div>

                {/* 3-Pips Visual Meter */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[0, 1, 2].map((idx) => {
                    const used = attemptStatus ? idx < attemptStatus.attemptsUsedThisMonth : false;
                    const recentAtt = attemptStatus?.recentAttempts[idx];
                    const isPassed = recentAtt?.passed;

                    let pipStyle = 'bg-base border-border text-muted';
                    let pipText = 'Available';

                    if (used) {
                      if (isPassed) {
                        pipStyle = 'bg-state-success/15 border-state-success/50 text-state-success';
                        pipText = `${recentAtt?.score}% (Passed)`;
                      } else {
                        pipStyle = 'bg-state-warning/15 border-state-warning/50 text-state-warning';
                        pipText = recentAtt?.score !== null ? `${recentAtt?.score}% (Failed)` : 'Used';
                      }
                    }

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-center font-mono text-[10px] flex flex-col items-center justify-center gap-1 ${pipStyle}`}
                      >
                        <span className="font-bold uppercase tracking-wider">Attempt #{idx + 1}</span>
                        <span className="text-[9px] opacity-80">{pipText}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Reset schedule notice */}
                <div className="text-[11px] text-muted flex items-center justify-between pt-1 border-t border-border/60">
                  <span>Monthly Reset:</span>
                  <span className="font-mono text-primary font-medium">
                    {attemptStatus
                      ? `In ${attemptStatus.daysUntilReset} days (${new Date(attemptStatus.nextResetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`
                      : '1st of next month'}
                  </span>
                </div>
              </div>

              {/* Invariant & Limit Warnings */}
              {attemptStatus && !attemptStatus.canAttempt && !isVerified ? (
                <div className="p-4 rounded-xl bg-state-warning/15 border border-state-warning/40 flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-state-warning mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs text-primary font-semibold">Monthly Attempt Limit Reached</p>
                    <p className="text-xs text-muted leading-relaxed">
                      You have used all 3 attempts for this calendar month. Study the recommended resources in the <span className="text-accent-primary font-medium">Learning Resources</span> tab while awaiting the next reset on {new Date(attemptStatus.nextResetDate).toLocaleDateString()}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-base border border-border flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-accent-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted leading-relaxed">
                    <strong className="text-primary font-semibold">Backend Enforced:</strong> All test attempts are scored deterministically server-side. Passing with 80% marks the skill as <span className="text-state-success font-mono font-bold">VERIFIED</span> and unlocks dependent competencies.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-border bg-elevated/40 flex items-center justify-between gap-4">
          {claimSuccess ? (
            <span className="text-xs text-state-success flex items-center gap-1 font-mono">
              <Check className="h-3.5 w-3.5" /> Skill Claim Recorded (Unverified)
            </span>
          ) : userSkillRecord ? (
            <span className="text-xs text-muted font-mono flex items-center gap-1">
              <Bookmark className="h-3.5 w-3.5 text-accent-primary" /> Tracked in Profile
            </span>
          ) : (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors font-medium"
            >
              <Bookmark className="h-3.5 w-3.5" />
              {claiming ? 'Recording...' : 'Add to Claimed Skills'}
            </button>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-muted hover:text-primary transition-colors"
            >
              Close
            </button>

            <button
              disabled={isLocked || (attemptStatus !== null && !attemptStatus.canAttempt && !isVerified)}
              onClick={() => {
                if (onStartAssessment && node) {
                  onStartAssessment(node);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-accent-primary text-base hover:bg-accent-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Shield className="h-3.5 w-3.5" />
              {isLocked
                ? 'Prerequisites Required'
                : attemptStatus && !attemptStatus.canAttempt && !isVerified
                ? 'Monthly Limit Reached (3/3)'
                : isVerified
                ? 'Retake Assessment'
                : 'Take Skill Assessment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

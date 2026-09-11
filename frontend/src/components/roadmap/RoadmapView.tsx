import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DomainDTO, RoadmapGraphData, SkillGraphNode } from '../../types/roadmap';
import { fetchDomains, fetchRoadmapGraph } from '../../lib/roadmapApi';
import { useAuth } from '../../context/AuthContext';
import { DomainSelector } from './DomainSelector';
import { SkillNodeCard } from './SkillNodeCard';
import { SkillDetailModal } from './SkillDetailModal';
import { TimedAssessmentModal } from '../assessment/TimedAssessmentModal';
import {
  LayoutEngine,
  SkillGraphCanvas,
  VisualizerControls,
  VisualizerNode,
} from '../visualizer';
import {
  GitBranch,
  Layers,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Lock,
  PlayCircle,
  Network,
} from 'lucide-react';

interface RoadmapViewProps {
  initialDomainSlug?: string;
  initialSkillId?: string;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  initialDomainSlug,
  initialSkillId,
}) => {
  const { token } = useAuth();
  const [domains, setDomains] = useState<DomainDTO[]>([]);
  const [selectedDomainSlug, setSelectedDomainSlug] = useState<string | null>(initialDomainSlug || null);
  const [graphData, setGraphData] = useState<RoadmapGraphData | null>(null);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View mode switcher: 'graph' (interactive visual DAG canvas) | 'tier' (structured stage list)
  const [viewMode, setViewMode] = useState<'graph' | 'tier'>('graph');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [layoutDirection, setLayoutDirection] = useState<'LR' | 'TB'>('LR');
  const [showMiniMap, setShowMiniMap] = useState<boolean>(true);

  // Selected skill modal state
  const [selectedNode, setSelectedNode] = useState<SkillGraphNode | null>(null);

  // Active assessment test modal state
  const [activeAssessmentSkill, setActiveAssessmentSkill] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const loadGraph = useCallback((slug: string) => {
    setLoadingGraph(true);
    setError(null);

    fetchRoadmapGraph(slug, token)
      .then((data) => {
        setGraphData(data);
        if (initialSkillId && data.nodes) {
          const matched = data.nodes.find(
            (n) => n.skill.id === initialSkillId || n.skill.slug === initialSkillId
          );
          if (matched) {
            setSelectedNode(matched);
          }
        }
        setLoadingGraph(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load roadmap graph');
        setLoadingGraph(false);
      });
  }, [token, initialSkillId]);

  // Load domain list on mount
  useEffect(() => {
    let isMounted = true;
    setLoadingDomains(true);
    setError(null);

    fetchDomains()
      .then((data) => {
        if (!isMounted) return;
        setDomains(data);
        if (data.length > 0 && !selectedDomainSlug) {
          setSelectedDomainSlug(initialDomainSlug || data[0].slug);
        }
        setLoadingDomains(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load learning domains');
        setLoadingDomains(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialDomainSlug, selectedDomainSlug]);

  // Load roadmap graph whenever selected domain slug or auth token changes
  useEffect(() => {
    if (selectedDomainSlug) {
      loadGraph(selectedDomainSlug);
    }
  }, [selectedDomainSlug, loadGraph]);

  // Compute distinct categories in the current roadmap
  const categories = useMemo(() => {
    if (!graphData) return [];
    const catSet = new Set<string>();
    graphData.nodes.forEach((n) => catSet.add(n.skill.category));
    return Array.from(catSet);
  }, [graphData]);

  // Filtered raw nodes
  const filteredGraphNodes = useMemo(() => {
    if (!graphData) return [];
    return graphData.nodes.filter((node) => {
      const matchSearch =
        !searchQuery ||
        node.skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.skill.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.skill.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        selectedCategory === 'all' || node.skill.category === selectedCategory;

      const matchDifficulty =
        selectedDifficulty === 'all' || node.skill.difficulty === selectedDifficulty;

      return matchSearch && matchCategory && matchDifficulty;
    });
  }, [graphData, searchQuery, selectedCategory, selectedDifficulty]);

  // Layout calculations for Visualizer Canvas
  const visualizerData = useMemo(() => {
    if (!graphData) {
      return { nodes: [], edges: [], bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 } };
    }
    // Compute layout on all nodes or filtered subset
    return LayoutEngine.computeLayout(filteredGraphNodes, {
      direction: layoutDirection,
    });
  }, [graphData, filteredGraphNodes, layoutDirection]);

  // Calculate topological stages/levels for visual progression
  const stageGroups = useMemo(() => {
    if (!graphData) return [];

    const nodes = filteredGraphNodes;
    const depthMap = new Map<string, number>();

    // Compute depth recursively
    const getDepth = (skillId: string, visited: Set<string> = new Set()): number => {
      if (depthMap.has(skillId)) return depthMap.get(skillId)!;
      if (visited.has(skillId)) return 0; // Prevent cycle

      visited.add(skillId);
      const node = graphData.nodes.find((n) => n.skill.id === skillId);
      if (!node || node.prerequisiteSkillIds.length === 0) {
        depthMap.set(skillId, 0);
        return 0;
      }

      let maxPrereqDepth = 0;
      for (const pId of node.prerequisiteSkillIds) {
        const d = getDepth(pId, new Set(visited));
        if (d + 1 > maxPrereqDepth) {
          maxPrereqDepth = d + 1;
        }
      }

      depthMap.set(skillId, maxPrereqDepth);
      return maxPrereqDepth;
    };

    nodes.forEach((n) => getDepth(n.skill.id));

    // Group nodes by depth
    const maxDepth = Math.max(0, ...Array.from(depthMap.values()));
    const stages: Array<{ level: number; title: string; nodes: SkillGraphNode[] }> = [];

    for (let d = 0; d <= maxDepth; d++) {
      const stageNodes = nodes.filter((n) => depthMap.get(n.skill.id) === d);
      if (stageNodes.length > 0) {
        let title = 'Foundation Stage';
        if (d === 1) title = 'Core & Intermediate Competencies';
        else if (d >= 2) title = 'Advanced Specialization';

        stages.push({
          level: d + 1,
          title: `Stage ${d + 1} — ${title}`,
          nodes: stageNodes,
        });
      }
    }

    return stages;
  }, [graphData, filteredGraphNodes]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface rounded-2xl p-6 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-accent-primary text-xs font-mono font-semibold uppercase tracking-wider">
            <GitBranch className="h-4 w-4" />
            <span>Interactive Learning Path</span>
          </div>
          <h2 className="text-xl font-bold text-primary">Prerequisite-Aware Skill Roadmap</h2>
          <p className="text-xs text-muted mt-1 max-w-2xl leading-relaxed">
            Select a domain to explore structured competencies. Dependent skills unlock sequentially as you verify required prerequisites through backend assessments (&gt;= 80%).
          </p>
        </div>

        {graphData && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-base/60 p-3 rounded-xl border border-border self-start md:self-auto font-mono text-xs">
            {graphData.summary ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-center px-2">
                  <span className="text-primary font-bold text-sm">{graphData.summary.totalSkills}</span>
                  <p className="text-[10px] text-muted uppercase">Total</p>
                </div>
                <div className="h-6 w-[1px] bg-border hidden sm:block" />
                <div className="text-center px-2">
                  <span className="text-state-success font-bold text-sm flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {graphData.summary.verifiedSkills}
                  </span>
                  <p className="text-[10px] text-muted uppercase">Verified</p>
                </div>
                <div className="h-6 w-[1px] bg-border hidden sm:block" />
                <div className="text-center px-2">
                  <span className="text-accent-primary font-bold text-sm flex items-center justify-center gap-1">
                    <PlayCircle className="h-3 w-3" />
                    {graphData.summary.availableSkills}
                  </span>
                  <p className="text-[10px] text-muted uppercase">Available</p>
                </div>
                <div className="h-6 w-[1px] bg-border hidden sm:block" />
                <div className="text-center px-2">
                  <span className="text-state-locked font-bold text-sm flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" />
                    {graphData.summary.lockedSkills}
                  </span>
                  <p className="text-[10px] text-muted uppercase">Locked</p>
                </div>
                <div className="h-6 w-[1px] bg-border hidden sm:block" />
                <div className="text-center px-2">
                  <span className="text-accent-secondary font-bold text-sm">
                    {graphData.summary.progressPercentage}%
                  </span>
                  <p className="text-[10px] text-muted uppercase">Mastery</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-center px-2">
                  <span className="text-primary font-bold text-sm">{graphData.nodes.length}</span>
                  <p className="text-[10px] text-muted uppercase">Skills</p>
                </div>
                <div className="h-6 w-[1px] bg-border" />
                <div className="text-center px-2">
                  <span className="text-accent-primary font-bold text-sm">
                    {graphData.nodes.filter((n) => n.prerequisiteSkillIds.length === 0).length}
                  </span>
                  <p className="text-[10px] text-muted uppercase">Foundation</p>
                </div>
                <div className="h-6 w-[1px] bg-border" />
                <div className="text-center px-2">
                  <span className="text-state-locked font-bold text-sm">
                    {graphData.nodes.filter((n) => n.prerequisiteSkillIds.length > 0).length}
                  </span>
                  <p className="text-[10px] text-muted uppercase">Locked</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Domain Selection */}
      <DomainSelector
        domains={domains}
        selectedDomainSlug={selectedDomainSlug}
        onSelectDomain={(slug) => setSelectedDomainSlug(slug)}
        loading={loadingDomains}
      />

      {/* View Mode Toggle & Overview Bar */}
      {graphData && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium">View Mode:</span>
            <div className="flex items-center bg-elevated rounded-xl p-1 border border-border/80">
              <button
                onClick={() => setViewMode('graph')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'graph'
                    ? 'bg-accent-primary text-base shadow-sm'
                    : 'text-muted hover:text-primary'
                }`}
              >
                <Network className="h-3.5 w-3.5" />
                <span>Visual Graph</span>
              </button>
              <button
                onClick={() => setViewMode('tier')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'tier'
                    ? 'bg-accent-primary text-base shadow-sm'
                    : 'text-muted hover:text-primary'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Tier Stages</span>
              </button>
            </div>
          </div>

          <div className="text-xs font-mono text-muted text-right">
            <span>{graphData.roadmap.title} (v{graphData.roadmap.version})</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-state-error/10 border border-state-error/30 text-state-error flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => selectedDomainSlug && setSelectedDomainSlug(selectedDomainSlug)}
            className="flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* Roadmap Content */}
      {loadingGraph ? (
        <div className="p-12 text-center bg-surface rounded-2xl border border-border space-y-3">
          <RefreshCw className="h-6 w-6 text-accent-primary animate-spin mx-auto" />
          <p className="text-xs text-muted font-mono">Loading domain roadmap graph...</p>
        </div>
      ) : graphData ? (
        <div className="space-y-4">
          {/* Visualizer Controls */}
          <VisualizerControls
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={setSelectedDifficulty}
            direction={layoutDirection}
            onDirectionToggle={() =>
              setLayoutDirection((prev) => (prev === 'LR' ? 'TB' : 'LR'))
            }
            showMiniMap={showMiniMap}
            onMiniMapToggle={() => setShowMiniMap((prev) => !prev)}
            onResetView={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedDifficulty('all');
            }}
          />

          {viewMode === 'graph' ? (
            /* Interactive Visual DAG Canvas */
            <SkillGraphCanvas
              nodes={visualizerData.nodes}
              edges={visualizerData.edges}
              bounds={visualizerData.bounds}
              selectedNodeId={selectedNode?.skill.id}
              showMiniMap={showMiniMap}
              onSelectNode={(node: VisualizerNode) => {
                if (!node.id) {
                  setSelectedNode(null);
                  return;
                }
                const fullNode = graphData.nodes.find((n) => n.skill.id === node.id) || null;
                setSelectedNode(fullNode);
              }}
              onNodeDoubleClick={(node: VisualizerNode) => {
                const fullNode = graphData.nodes.find((n) => n.skill.id === node.id) || null;
                if (fullNode) setSelectedNode(fullNode);
              }}
              onLaunchAssessment={(skillId, skillName) => {
                setActiveAssessmentSkill({ id: skillId, name: skillName });
              }}
            />
          ) : (
            /* Structured Stage List View */
            <div className="space-y-6 pt-2">
              {stageGroups.map((stage) => {
                if (stage.nodes.length === 0) return null;

                return (
                  <div key={stage.level} className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/70">
                      <div className="h-2 w-2 rounded-full bg-accent-primary" />
                      <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                        {stage.title}
                      </h4>
                      <span className="text-[10px] font-mono text-muted bg-base px-2 py-0.5 rounded border border-border ml-auto">
                        {stage.nodes.length} {stage.nodes.length === 1 ? 'Skill' : 'Skills'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stage.nodes.map((node) => (
                        <SkillNodeCard
                          key={node.skill.id}
                          node={node}
                          allNodes={graphData.nodes}
                          onSelect={(selected) => setSelectedNode(selected)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-surface rounded-2xl border border-border">
          <Layers className="h-8 w-8 text-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium text-primary">No Roadmap Loaded</p>
          <p className="text-xs text-muted mt-1">Please select a domain above to view its skill progression graph.</p>
        </div>
      )}

      {/* Skill Detail Modal */}
      <SkillDetailModal
        node={selectedNode}
        allNodes={graphData?.nodes || []}
        onClose={() => setSelectedNode(null)}
        onSelectPrereqNode={(prereq) => setSelectedNode(prereq)}
        onSkillClaimed={() => selectedDomainSlug && loadGraph(selectedDomainSlug)}
        onStartAssessment={(nodeToAssess) => {
          setSelectedNode(null);
          setActiveAssessmentSkill({
            id: nodeToAssess.skill.id,
            name: nodeToAssess.skill.name,
          });
        }}
      />

      {/* Timed Assessment Test Modal */}
      {activeAssessmentSkill && (
        <TimedAssessmentModal
          skillId={activeAssessmentSkill.id}
          skillName={activeAssessmentSkill.name}
          isOpen={Boolean(activeAssessmentSkill)}
          onClose={() => setActiveAssessmentSkill(null)}
          onComplete={() => {
            if (selectedDomainSlug) {
              loadGraph(selectedDomainSlug);
            }
          }}
        />
      )}
    </div>
  );
};

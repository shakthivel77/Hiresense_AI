import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  VisualizerNode,
  VisualizerEdge,
  CanvasTransform,
  LayoutBounds,
  HighlightFilterMode,
} from './types';
import { DependencyTraversalEngine } from './traversalEngine';
import { SkillProfileOverlay } from './SkillProfileOverlay';
import { MiniMap } from './MiniMap';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Map,
} from 'lucide-react';

interface SkillGraphCanvasProps {
  nodes: VisualizerNode[];
  edges: VisualizerEdge[];
  bounds: LayoutBounds;
  selectedNodeId?: string | null;
  onSelectNode?: (node: VisualizerNode) => void;
  onNodeDoubleClick?: (node: VisualizerNode) => void;
  onLaunchAssessment?: (skillId: string, skillName: string) => void;
  showOverlay?: boolean;
  showMiniMap?: boolean;
}

export const SkillGraphCanvas: React.FC<SkillGraphCanvasProps> = ({
  nodes,
  edges,
  bounds,
  selectedNodeId,
  onSelectNode,
  onNodeDoubleClick,
  onLaunchAssessment,
  showOverlay = true,
  showMiniMap = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<CanvasTransform>({ x: 40, y: 40, scale: 0.85 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeFilter, setActiveFilter] = useState<HighlightFilterMode>('all');
  const [simulationMessage, setSimulationMessage] = useState<string | null>(null);
  const [miniMapVisible, setMiniMapVisible] = useState<boolean>(showMiniMap);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: 900,
    height: 620,
  });

  // Track container dimensions on resize
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Center & Fit View Helper
  const fitView = useCallback(() => {
    if (!containerRef.current || bounds.width === 0 || bounds.height === 0) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 80;
    const scaleX = (clientWidth - padding) / bounds.width;
    const scaleY = (clientHeight - padding) / bounds.height;
    const scale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.2);

    const x = (clientWidth - bounds.width * scale) / 2 - bounds.minX * scale + 40;
    const y = (clientHeight - bounds.height * scale) / 2 - bounds.minY * scale + 40;

    setTransform({ x, y, scale });
  }, [bounds]);

  // Initial fit on mount or when bounds change meaningfully
  useEffect(() => {
    fitView();
  }, [bounds.width, bounds.height, fitView]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(Math.max(transform.scale * zoomFactor, 0.25), 2.2);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom towards mouse pointer
    const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
    const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);

    setTransform({ x: newX, y: newY, scale: newScale });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 2.2),
    }));
  };

  const zoomOut = () => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(prev.scale * 0.8, 0.25),
    }));
  };

  // Determine active traversal highlights via DependencyTraversalEngine
  const highlightState = useMemo(() => {
    return DependencyTraversalEngine.getTraversalHighlightState(
      selectedNodeId || null,
      nodes,
      edges
    );
  }, [selectedNodeId, nodes, edges]);

  const activeSelected = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const isAnyNodeSelected = Boolean(selectedNodeId);

  // Handle unlock simulation
  const handleSimulateUnlock = (skillId: string) => {
    const simResult = DependencyTraversalEngine.simulateUnlock([skillId], nodes);
    const target = nodes.find((n) => n.id === skillId);
    if (simResult.newlyUnlockedSkillIds.length > 0) {
      const unlockedNames = simResult.newlyUnlockedSkillIds
        .map((id) => nodes.find((n) => n.id === id)?.name || id)
        .join(', ');
      setSimulationMessage(
        `✨ Passing "${target?.name || 'this skill'}" unlocks: ${unlockedNames}`
      );
    } else {
      setSimulationMessage(
        `Passing "${target?.name || 'this skill'}" satisfies one prerequisite, but other prerequisites remain.`
      );
    }
    setTimeout(() => setSimulationMessage(null), 6000);
  };

  const getNodeStatusStyle = (
    status: string,
    isSelected: boolean,
    isPrereq: boolean,
    isMissingPrereq: boolean,
    isDep: boolean
  ) => {
    if (isSelected) {
      return 'border-accent-primary ring-2 ring-accent-primary/60 shadow-lg shadow-accent-primary/20 bg-surface scale-[1.02] z-10';
    }
    if (isMissingPrereq) {
      return 'border-state-warning ring-2 ring-state-warning/50 bg-state-warning/10 shadow-md shadow-state-warning/10';
    }
    if (isPrereq) {
      return 'border-state-warning/60 bg-state-warning/5 shadow-sm shadow-state-warning/10';
    }
    if (isDep) {
      return 'border-accent-primary/60 bg-accent-primary/5 shadow-sm shadow-accent-primary/10';
    }

    switch (status) {
      case 'verified':
        return 'border-state-success/40 bg-state-success/5 shadow-sm shadow-state-success/10 hover:border-state-success';
      case 'in_progress':
        return 'border-state-warning/40 bg-state-warning/5 hover:border-state-warning';
      case 'available':
        return 'border-accent-primary/30 bg-surface hover:border-accent-primary/60';
      case 'locked':
      default:
        return 'border-border/60 bg-elevated/30 opacity-70 hover:opacity-100 hover:border-border';
    }
  };

  return (
    <div className="space-y-3">
      {/* Skill Profile & Mastery HUD Overlay */}
      {showOverlay && (
        <SkillProfileOverlay
          nodes={nodes}
          selectedNode={activeSelected}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onLaunchAssessment={onLaunchAssessment}
          onSimulateUnlock={handleSimulateUnlock}
          onCloseInspector={() => {
            if (onSelectNode && activeSelected) {
              // Deselect
              const emptyNode = { ...activeSelected, id: '' };
              onSelectNode(emptyNode);
            }
          }}
        />
      )}

      {/* Simulation Banner Notification */}
      {simulationMessage && (
        <div className="p-3 bg-accent-secondary/15 border border-accent-secondary/40 rounded-xl text-xs text-primary font-medium flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span>{simulationMessage}</span>
          <button
            onClick={() => setSimulationMessage(null)}
            className="text-muted hover:text-primary text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full h-[620px] bg-base rounded-2xl border border-border overflow-hidden select-none cursor-${
          isDragging ? 'grabbing' : 'grab'
        }`}
      >
        {/* Background Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <defs>
            <pattern
              id="graph-grid"
              width={32 * transform.scale}
              height={32 * transform.scale}
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${transform.x % (32 * transform.scale)}, ${
                transform.y % (32 * transform.scale)
              })`}
            >
              <circle cx="1" cy="1" r="1" fill="#4B5563" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#graph-grid)" />
        </svg>

        {/* Floating Canvas Controls Toolbar */}
        <div className="absolute bottom-5 right-5 z-20 flex items-center gap-1.5 bg-surface/90 backdrop-blur border border-border p-1.5 rounded-xl shadow-xl">
          <button
            onClick={zoomIn}
            title="Zoom In"
            className="p-2 hover:bg-elevated text-muted hover:text-primary rounded-lg transition-colors"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={zoomOut}
            title="Zoom Out"
            className="p-2 hover:bg-elevated text-muted hover:text-primary rounded-lg transition-colors"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <div className="h-4 w-[1px] bg-border mx-0.5" />
          <button
            onClick={fitView}
            title="Fit to Viewport"
            className="p-2 hover:bg-elevated text-muted hover:text-primary rounded-lg transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMiniMapVisible((prev) => !prev)}
            title="Toggle Mini-Map"
            className={`p-2 rounded-lg transition-colors ${
              miniMapVisible
                ? 'bg-accent-primary/20 text-accent-primary'
                : 'hover:bg-elevated text-muted hover:text-primary'
            }`}
          >
            <Map className="h-4 w-4" />
          </button>
          <span className="text-[11px] font-mono text-muted px-2 min-w-[48px] text-center">
            {Math.round(transform.scale * 100)}%
          </span>
        </div>

        {/* Interactive Mini-Map */}
        {miniMapVisible && (
          <div className="absolute bottom-5 left-5 z-20 animate-in fade-in duration-200">
            <MiniMap
              nodes={nodes}
              edges={edges}
              bounds={bounds}
              transform={transform}
              containerWidth={containerDimensions.width}
              containerHeight={containerDimensions.height}
              onNavigate={(newX, newY) => {
                setTransform((prev) => ({ ...prev, x: newX, y: newY }));
              }}
            />
          </div>
        )}

        {/* Transformed Workspace Layer */}
        <div
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.05s ease-out',
          }}
          className="absolute top-0 left-0"
        >
          {/* SVG Edges Layer */}
          <svg
            style={{
              width: `${Math.max(bounds.width + bounds.minX + 400, 2400)}px`,
              height: `${Math.max(bounds.height + bounds.minY + 400, 1600)}px`,
            }}
            className="absolute top-0 left-0 pointer-events-none overflow-visible"
          >
            <defs>
              <marker
                id="arrow-default"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#4B5563" />
              </marker>
              <marker
                id="arrow-prereq"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#FBBF24" />
              </marker>
              <marker
                id="arrow-dep"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
              </marker>
              <marker
                id="arrow-highlight"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366F1" />
              </marker>
            </defs>

            {edges.map((edge) => {
              const isPrereqEdge = highlightState.prerequisiteEdgeIds.has(edge.id);
              const isDepEdge = highlightState.dependentEdgeIds.has(edge.id);
              const isConnectedToSelected =
                edge.sourceId === selectedNodeId || edge.targetId === selectedNodeId;

              let strokeColor = '#374151';
              let strokeWidth = 1.5;
              let marker = 'url(#arrow-default)';
              let opacity = isAnyNodeSelected ? 0.25 : 0.8;

              if (isPrereqEdge) {
                strokeColor = '#FBBF24';
                strokeWidth = 2.5;
                marker = 'url(#arrow-prereq)';
                opacity = 1.0;
              } else if (isDepEdge) {
                strokeColor = '#38BDF8';
                strokeWidth = 2.5;
                marker = 'url(#arrow-dep)';
                opacity = 1.0;
              } else if (isConnectedToSelected) {
                strokeColor = '#6366F1';
                strokeWidth = 2.5;
                marker = 'url(#arrow-highlight)';
                opacity = 1.0;
              }

              return (
                <path
                  key={edge.id}
                  d={edge.pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeOpacity={opacity}
                  markerEnd={marker}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>

          {/* HTML Node Cards Layer */}
          {nodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const isPrereq = highlightState.prerequisiteNodeIds.has(node.id);
            const isMissingPrereq = highlightState.missingPrerequisiteNodeIds.has(node.id);
            const isDep = highlightState.dependentNodeIds.has(node.id);

            // Filter matching check
            let matchesFilter = true;
            if (activeFilter === 'verified_only' && node.status !== 'verified') {
              matchesFilter = false;
            } else if (activeFilter === 'available_only' && node.status !== 'available' && node.status !== 'in_progress') {
              matchesFilter = false;
            } else if (activeFilter === 'missing_prereqs' && (node.status === 'verified' || node.prerequisites.length === 0)) {
              matchesFilter = false;
            }

            const isRelated = isSelected || isPrereq || isDep;
            let opacityStyle = 'opacity-100';

            if (!matchesFilter) {
              opacityStyle = 'opacity-20';
            } else if (isAnyNodeSelected && !isRelated) {
              opacityStyle = 'opacity-30';
            }

            return (
              <div
                key={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectNode) onSelectNode(node);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (onNodeDoubleClick) onNodeDoubleClick(node);
                }}
                style={{
                  position: 'absolute',
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${node.width}px`,
                  height: `${node.height}px`,
                }}
                className={`rounded-xl border p-3 cursor-pointer transition-all duration-200 flex flex-col justify-between ${opacityStyle} ${getNodeStatusStyle(
                  node.status,
                  isSelected,
                  isPrereq,
                  isMissingPrereq,
                  isDep
                )}`}
              >
                {/* Card Header: Category & Status Icon */}
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-bold truncate max-w-[120px]">
                    {node.category}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    {isMissingPrereq && (
                      <span title="Missing Required Prerequisite" className="text-state-warning">
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {node.status === 'verified' && (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-state-success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {node.verificationScore ? `${node.verificationScore}%` : '80%+'}
                      </span>
                    )}
                    {node.status === 'available' && <Unlock className="h-3 w-3 text-accent-primary" />}
                    {node.status === 'in_progress' && <Clock className="h-3 w-3 text-state-warning" />}
                    {node.status === 'locked' && <Lock className="h-3 w-3 text-muted/60" />}
                  </div>
                </div>

                {/* Skill Name */}
                <h4 className="text-xs font-bold text-primary tracking-tight leading-tight line-clamp-2">
                  {node.name}
                </h4>

                {/* Card Footer: Difficulty, Depth Level, and Traversal/Attempt Indicator */}
                <div className="flex items-center justify-between text-[10px] text-muted font-mono pt-1 border-t border-border/40">
                  <span className="capitalize">{node.difficulty}</span>
                  <div className="flex items-center gap-1.5">
                    {node.attemptCount != null && node.attemptCount > 0 && (
                      <span className="text-muted/70 text-[9px]">
                        {node.attemptCount}/3 att
                      </span>
                    )}
                    {isPrereq && <span className="text-state-warning text-[9px]">Prereq</span>}
                    {isDep && <span className="text-accent-primary text-[9px]">Unlocks</span>}
                    <span className="text-muted/60">L{node.layer + 1}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

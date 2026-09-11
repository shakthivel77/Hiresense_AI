import React, { useRef } from 'react';
import { VisualizerNode, VisualizerEdge, LayoutBounds, CanvasTransform } from './types';

interface MiniMapProps {
  nodes: VisualizerNode[];
  edges: VisualizerEdge[];
  bounds: LayoutBounds;
  transform: CanvasTransform;
  containerWidth: number;
  containerHeight: number;
  onNavigate: (newX: number, newY: number) => void;
  className?: string;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  nodes,
  edges,
  bounds,
  transform,
  containerWidth,
  containerHeight,
  onNavigate,
  className = '',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapWidth = 180;
  const mapHeight = 110;

  if (bounds.width === 0 || bounds.height === 0 || nodes.length === 0) {
    return null;
  }

  // Calculate scale to fit bounds into mini-map dimensions with padding
  const padding = 16;
  const availableW = mapWidth - padding * 2;
  const availableH = mapHeight - padding * 2;
  const scale = Math.min(availableW / bounds.width, availableH / bounds.height);

  const offsetX = (mapWidth - bounds.width * scale) / 2 - bounds.minX * scale;
  const offsetY = (mapHeight - bounds.height * scale) / 2 - bounds.minY * scale;

  // Viewport rectangle calculation
  // Canvas coordinate = (screenCoord - transform.x) / transform.scale
  const viewMinX = -transform.x / transform.scale;
  const viewMinY = -transform.y / transform.scale;
  const viewWidth = containerWidth / transform.scale;
  const viewHeight = containerHeight / transform.scale;

  const rectX = Math.max(viewMinX * scale + offsetX, 0);
  const rectY = Math.max(viewMinY * scale + offsetY, 0);
  const rectW = Math.min(viewWidth * scale, mapWidth);
  const rectH = Math.min(viewHeight * scale, mapHeight);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert mini-map click to graph coordinates
    const graphX = (clickX - offsetX) / scale;
    const graphY = (clickY - offsetY) / scale;

    // Center viewport at graphX, graphY
    const newX = containerWidth / 2 - graphX * transform.scale;
    const newY = containerHeight / 2 - graphY * transform.scale;

    onNavigate(newX, newY);
  };

  return (
    <div
      ref={mapRef}
      onClick={handleClick}
      style={{ width: `${mapWidth}px`, height: `${mapHeight}px` }}
      className={`bg-surface/90 backdrop-blur-md border border-border/80 rounded-xl overflow-hidden shadow-2xl cursor-crosshair select-none ${className}`}
      title="Click on mini-map to pan view"
    >
      <svg width={mapWidth} height={mapHeight} className="w-full h-full">
        {/* Render scaled edges */}
        {edges.map((edge) => {
          const x1 = edge.sourcePos.x * scale + offsetX;
          const y1 = edge.sourcePos.y * scale + offsetY;
          const x2 = edge.targetPos.x * scale + offsetX;
          const y2 = edge.targetPos.y * scale + offsetY;

          return (
            <line
              key={edge.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#374151"
              strokeWidth="0.8"
              opacity="0.6"
            />
          );
        })}

        {/* Render scaled nodes */}
        {nodes.map((node) => {
          const nx = node.x * scale + offsetX;
          const ny = node.y * scale + offsetY;
          const nw = Math.max(node.width * scale, 3);
          const nh = Math.max(node.height * scale, 2);

          let fillColor = '#6B7280';
          if (node.status === 'verified') fillColor = '#34D399';
          else if (node.status === 'available') fillColor = '#38BDF8';
          else if (node.status === 'in_progress') fillColor = '#FBBF24';

          return (
            <rect
              key={node.id}
              x={nx}
              y={ny}
              width={nw}
              height={nh}
              rx="1"
              fill={fillColor}
              opacity={node.isSelected ? 1 : 0.75}
            />
          );
        })}

        {/* Viewport Indicator Rectangle */}
        <rect
          x={rectX}
          y={rectY}
          width={Math.max(rectW, 6)}
          height={Math.max(rectH, 6)}
          fill="#38BDF8"
          fillOpacity="0.15"
          stroke="#38BDF8"
          strokeWidth="1.2"
          strokeDasharray="2 1"
          rx="2"
        />
      </svg>
    </div>
  );
};

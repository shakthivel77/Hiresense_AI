import React from 'react';
import { Search, X, Filter, RotateCcw, ArrowRightLeft, ArrowUpDown, Map } from 'lucide-react';

interface VisualizerControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedDifficulty: string;
  onDifficultyChange: (difficulty: string) => void;
  direction: 'LR' | 'TB';
  onDirectionToggle: () => void;
  showMiniMap: boolean;
  onMiniMapToggle: () => void;
  onResetView: () => void;
  className?: string;
}

export const VisualizerControls: React.FC<VisualizerControlsProps> = ({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  direction,
  onDirectionToggle,
  showMiniMap,
  onMiniMapToggle,
  onResetView,
  className = '',
}) => {
  return (
    <div
      className={`bg-surface/90 backdrop-blur-md border border-border rounded-2xl p-3 shadow-lg flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      {/* Left: Search Bar */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search skills, categories..."
          className="w-full bg-elevated/70 border border-border/80 rounded-xl pl-9 pr-8 py-1.5 text-xs text-primary placeholder-muted/60 focus:outline-none focus:border-accent-primary transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Middle: Category & Difficulty Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Category Dropdown */}
        <div className="flex items-center gap-1.5 bg-elevated/70 border border-border/80 rounded-xl px-2.5 py-1">
          <Filter className="h-3.5 w-3.5 text-muted" />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="bg-transparent text-xs text-primary focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-surface text-primary">
              All Categories
            </option>
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-surface text-primary">
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Dropdown */}
        <div className="flex items-center gap-1.5 bg-elevated/70 border border-border/80 rounded-xl px-2.5 py-1">
          <select
            value={selectedDifficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="bg-transparent text-xs text-primary focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-surface text-primary">
              All Difficulties
            </option>
            <option value="beginner" className="bg-surface text-primary">
              Beginner
            </option>
            <option value="intermediate" className="bg-surface text-primary">
              Intermediate
            </option>
            <option value="advanced" className="bg-surface text-primary">
              Advanced
            </option>
          </select>
        </div>
      </div>

      {/* Right: Layout Toggle & Utility Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onDirectionToggle}
          title={`Switch to ${direction === 'LR' ? 'Top-to-Bottom' : 'Left-to-Right'} layout`}
          className="flex items-center gap-1.5 bg-elevated/70 hover:bg-elevated text-muted hover:text-primary border border-border/80 rounded-xl px-2.5 py-1.5 text-xs transition-colors"
        >
          {direction === 'LR' ? (
            <>
              <ArrowRightLeft className="h-3.5 w-3.5 text-accent-primary" />
              <span>Left-to-Right</span>
            </>
          ) : (
            <>
              <ArrowUpDown className="h-3.5 w-3.5 text-accent-secondary" />
              <span>Top-to-Bottom</span>
            </>
          )}
        </button>

        <button
          onClick={onMiniMapToggle}
          title="Toggle Mini-Map"
          className={`flex items-center gap-1.5 border rounded-xl px-2.5 py-1.5 text-xs transition-colors ${
            showMiniMap
              ? 'bg-accent-primary/10 border-accent-primary/50 text-accent-primary font-bold'
              : 'bg-elevated/70 hover:bg-elevated border-border/80 text-muted hover:text-primary'
          }`}
        >
          <Map className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Map</span>
        </button>

        <button
          onClick={onResetView}
          title="Reset View"
          className="p-1.5 bg-elevated/70 hover:bg-elevated text-muted hover:text-primary border border-border/80 rounded-xl transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

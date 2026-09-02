import React from 'react';
import { DomainDTO } from '../../types/roadmap';
import { Server, Layout, Brain, Compass } from 'lucide-react';

interface DomainSelectorProps {
  domains: DomainDTO[];
  selectedDomainSlug: string | null;
  onSelectDomain: (slug: string) => void;
  loading: boolean;
}

export const DomainSelector: React.FC<DomainSelectorProps> = ({
  domains,
  selectedDomainSlug,
  onSelectDomain,
  loading,
}) => {
  const getDomainIcon = (slug: string) => {
    switch (slug) {
      case 'backend-developer':
        return <Server className="h-5 w-5 text-accent-primary" />;
      case 'frontend-developer':
        return <Layout className="h-5 w-5 text-accent-secondary" />;
      case 'ai-data-engineer':
        return <Brain className="h-5 w-5 text-state-success" />;
      default:
        return <Compass className="h-5 w-5 text-accent-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-surface rounded-xl border border-border/50"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Select Learning Domain
        </h3>
        <span className="text-xs text-muted font-mono">{domains.length} Domains Available</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {domains.map((domain) => {
          const isSelected = domain.slug === selectedDomainSlug;
          return (
            <button
              key={domain.id}
              onClick={() => onSelectDomain(domain.slug)}
              className={`text-left p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                isSelected
                  ? 'bg-elevated border-accent-primary shadow-lg shadow-accent-primary/5'
                  : 'bg-surface border-border hover:border-border/80 hover:bg-elevated/40'
              }`}
            >
              <div className="flex items-start justify-between w-full">
                <div className="p-2 bg-base rounded-lg border border-border">
                  {getDomainIcon(domain.slug)}
                </div>
                {isSelected && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                    Active Roadmap
                  </span>
                )}
              </div>

              <div className="mt-3">
                <h4 className="font-semibold text-primary text-sm">{domain.name}</h4>
                {domain.description && (
                  <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">
                    {domain.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

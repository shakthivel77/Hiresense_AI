import React from 'react';
import { VerificationProof } from '../../lib/portfolioApi';
import { ShieldCheck, Calendar, Hash, ExternalLink } from 'lucide-react';

interface VerificationProofCardProps {
  proof: VerificationProof;
  onInspectProof: (proofId: string) => void;
  onOpenEmbedModal?: (proof: VerificationProof) => void;
}

export const VerificationProofCard: React.FC<VerificationProofCardProps> = ({
  proof,
  onInspectProof,
  onOpenEmbedModal,
}) => {
  return (
    <div className="bg-surface hover:bg-elevated/40 border border-border hover:border-state-success/40 rounded-2xl p-5 transition-all flex flex-col justify-between space-y-4 group">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              {proof.category}
            </span>
            <span className="text-[10px] uppercase font-mono font-medium text-muted">
              {proof.difficulty}
            </span>
          </div>
          <h4 className="text-base font-bold text-primary group-hover:text-state-success transition-colors">
            {proof.skillName}
          </h4>
        </div>

        <div className="flex flex-col items-end">
          <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-state-success/15 text-state-success border border-state-success/30">
            <ShieldCheck className="h-3.5 w-3.5" />
            {proof.score}%
          </span>
          <span className="text-[10px] text-muted font-mono mt-0.5">Score &gt;= 80%</span>
        </div>
      </div>

      {/* Proof Info & Hash */}
      <div className="space-y-2 pt-2 border-t border-border text-xs">
        <div className="flex items-center justify-between text-muted font-mono">
          <span className="flex items-center gap-1 text-[11px]">
            <Hash className="h-3 w-3 text-accent-primary" />
            {proof.proofId}
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <Calendar className="h-3 w-3" />
            {new Date(proof.verificationDate).toLocaleDateString()}
          </span>
        </div>

        <p className="text-[11px] text-muted line-clamp-1 font-mono">
          HMAC: {proof.verificationHash.slice(0, 16)}...
        </p>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={() => onInspectProof(proof.proofId)}
          className="flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2 px-2.5 rounded-xl bg-base border border-border hover:border-state-success/50 text-primary hover:text-state-success transition-colors"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-state-success" />
          <span>Verify Proof</span>
        </button>

        {onOpenEmbedModal && (
          <button
            onClick={() => onOpenEmbedModal(proof)}
            className="flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2 px-2.5 rounded-xl bg-base border border-border hover:border-accent-primary/50 text-primary hover:text-accent-primary transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-accent-primary" />
            <span>Badge / Embed</span>
          </button>
        )}
      </div>
    </div>
  );
};

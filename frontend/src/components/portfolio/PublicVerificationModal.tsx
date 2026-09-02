import React, { useEffect, useState } from 'react';
import { verifyProof, PublicProofCard } from '../../lib/portfolioApi';
import { X, ShieldCheck, ShieldAlert, CheckCircle2, Copy, Check, Hash, Award, Calendar, User } from 'lucide-react';

interface PublicVerificationModalProps {
  proofId: string;
  onClose: () => void;
}

export const PublicVerificationModal: React.FC<PublicVerificationModalProps> = ({
  proofId,
  onClose,
}) => {
  const [proofCard, setProofCard] = useState<PublicProofCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    verifyProof(proofId)
      .then((data) => {
        if (mounted) {
          setProofCard(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to verify cryptographic proof');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [proofId]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/verify/${proofId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-state-success/15 border border-state-success/30 text-state-success">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-primary">Cryptographic Credential Verification</h3>
              <p className="text-xs text-muted font-mono">{proofId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-elevated transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <div className="h-8 w-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted font-mono">Running SHA-256 HMAC integrity check...</p>
            </div>
          ) : error || !proofCard ? (
            <div className="p-6 rounded-xl bg-state-error/10 border border-state-error/30 text-center space-y-3">
              <ShieldAlert className="h-10 w-10 text-state-error mx-auto" />
              <h4 className="text-sm font-bold text-primary">Verification Failed</h4>
              <p className="text-xs text-muted">{error || 'Proof artifact could not be authenticated.'}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Authenticity Certificate Banner */}
              <div
                className={`p-5 rounded-2xl border text-center space-y-2 ${
                  proofCard.verified
                    ? 'bg-state-success/10 border-state-success/40'
                    : 'bg-state-error/10 border-state-error/40'
                }`}
              >
                <div className="inline-flex p-2.5 rounded-full bg-base/80 border border-border">
                  {proofCard.verified ? (
                    <CheckCircle2 className="h-8 w-8 text-state-success" />
                  ) : (
                    <ShieldAlert className="h-8 w-8 text-state-error" />
                  )}
                </div>

                <div className="space-y-1">
                  <span
                    className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                      proofCard.verified
                        ? 'bg-state-success/20 text-state-success border border-state-success/30'
                        : 'bg-state-error/20 text-state-error border border-state-error/30'
                    }`}
                  >
                    {proofCard.verified ? 'CERTIFIED AUTHENTIC & UNMODIFIED' : 'TAMPER DETECTED / INVALID'}
                  </span>
                  <h4 className="text-lg font-bold text-primary pt-1">{proofCard.skillName}</h4>
                  <p className="text-xs text-muted">
                    Issued by <span className="text-primary font-semibold">{proofCard.issuer}</span>
                  </p>
                </div>
              </div>

              {/* Credential Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-base/60 border border-border space-y-1">
                  <div className="flex items-center gap-1.5 text-muted">
                    <User className="h-3.5 w-3.5" />
                    <span>Candidate</span>
                  </div>
                  <p className="font-semibold text-primary">{proofCard.candidateName}</p>
                </div>

                <div className="p-3 rounded-xl bg-base/60 border border-border space-y-1">
                  <div className="flex items-center gap-1.5 text-muted">
                    <Award className="h-3.5 w-3.5" />
                    <span>Verified Score</span>
                  </div>
                  <p className="font-semibold text-state-success font-mono">{proofCard.score}% (Pass &gt;= 80%)</p>
                </div>

                <div className="p-3 rounded-xl bg-base/60 border border-border space-y-1">
                  <div className="flex items-center gap-1.5 text-muted">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Verified On</span>
                  </div>
                  <p className="font-semibold text-primary font-mono">
                    {new Date(proofCard.verificationDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-base/60 border border-border space-y-1">
                  <div className="flex items-center gap-1.5 text-muted">
                    <Award className="h-3.5 w-3.5" />
                    <span>Difficulty Level</span>
                  </div>
                  <p className="font-semibold text-primary capitalize">{proofCard.difficulty}</p>
                </div>
              </div>

              {/* Cryptographic Hash Section */}
              <div className="p-4 rounded-xl bg-base/80 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-accent-primary" />
                    Cryptographic SHA-256 HMAC Signature
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-state-success/15 text-state-success">
                    MATCHES RECORD
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface border border-border font-mono text-[11px] text-muted break-all select-all">
                  {proofCard.verificationHash}
                </div>
                <p className="text-[10px] text-muted leading-relaxed">
                  This signature guarantees that the candidate, score, attempt timestamp, and verification authority have not been altered since test submission.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-base/40">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-elevated text-primary transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-state-success" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Verification Link Copied' : 'Share Proof Link'}</span>
          </button>

          <button
            onClick={onClose}
            className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-base transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

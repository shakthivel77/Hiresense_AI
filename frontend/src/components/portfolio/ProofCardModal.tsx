import React, { useState } from 'react';
import { VerificationProof } from '../../lib/portfolioApi';
import { X, Award, Download, Copy, Check, Code, ExternalLink, Sparkles } from 'lucide-react';

interface ProofCardModalProps {
  proof: VerificationProof;
  onClose: () => void;
}

export const ProofCardModal: React.FC<ProofCardModalProps> = ({
  proof,
  onClose,
}) => {
  const [copiedType, setCopiedType] = useState<'md' | 'html' | 'url' | null>(null);

  const origin = window.location.origin;
  const badgeUrl = `${origin}/api/portfolio/badge/${proof.proofId}.svg`;
  const verifyUrl = `${origin}/verify/${proof.proofId}`;

  const markdownSnippet = `[![Hiresense_AI Verified: ${proof.skillName}](${badgeUrl})](${verifyUrl})`;
  const htmlSnippet = `<a href="${verifyUrl}" target="_blank"><img src="${badgeUrl}" alt="Hiresense_AI Verified: ${proof.skillName}" width="500" height="260" /></a>`;

  const copyToClipboard = (text: string, type: 'md' | 'html' | 'url') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const downloadSvg = async () => {
    try {
      const res = await fetch(`/api/portfolio/badge/${proof.proofId}.svg`);
      const svgText = await res.text();
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hiresense-verification-${proof.proofId.toLowerCase()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download SVG badge:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent-primary/15 border border-accent-primary/30 text-accent-primary">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-primary">Verifiable Proof Badge Card</h3>
              <p className="text-xs text-muted font-mono">{proof.proofId}</p>
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
          {/* Card Preview Banner */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-accent-primary" />
                Live Standalone SVG Badge Preview
              </span>
              <button
                onClick={downloadSvg}
                className="flex items-center gap-1 text-xs font-semibold text-accent-primary hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download SVG Asset</span>
              </button>
            </div>

            <div className="p-3 bg-base/90 rounded-2xl border border-border flex items-center justify-center overflow-hidden">
              <img
                src={`/api/portfolio/badge/${proof.proofId}.svg`}
                alt={`Proof Badge for ${proof.skillName}`}
                className="w-full max-w-[500px] h-auto rounded-xl shadow-lg border border-border/50"
              />
            </div>
          </div>

          {/* Embed Snippets Tabs & Copy */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Code className="h-3.5 w-3.5 text-accent-primary" />
              Embed in GitHub README / LinkedIn / Portfolio
            </h4>

            {/* Markdown Snippet */}
            <div className="p-3.5 rounded-xl bg-base border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary">GitHub Markdown Snippet</span>
                <button
                  onClick={() => copyToClipboard(markdownSnippet, 'md')}
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-elevated hover:bg-elevated/80 text-primary transition-colors"
                >
                  {copiedType === 'md' ? (
                    <Check className="h-3.5 w-3.5 text-state-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedType === 'md' ? 'Copied' : 'Copy Markdown'}</span>
                </button>
              </div>
              <div className="p-2.5 bg-surface rounded-lg font-mono text-[11px] text-muted break-all select-all">
                {markdownSnippet}
              </div>
            </div>

            {/* HTML Snippet */}
            <div className="p-3.5 rounded-xl bg-base border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary">HTML Embed Snippet</span>
                <button
                  onClick={() => copyToClipboard(htmlSnippet, 'html')}
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-elevated hover:bg-elevated/80 text-primary transition-colors"
                >
                  {copiedType === 'html' ? (
                    <Check className="h-3.5 w-3.5 text-state-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedType === 'html' ? 'Copied' : 'Copy HTML'}</span>
                </button>
              </div>
              <div className="p-2.5 bg-surface rounded-lg font-mono text-[11px] text-muted break-all select-all">
                {htmlSnippet}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-base/40">
          <button
            onClick={() => copyToClipboard(verifyUrl, 'url')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-elevated text-primary transition-colors"
          >
            {copiedType === 'url' ? <Check className="h-3.5 w-3.5 text-state-success" /> : <ExternalLink className="h-3.5 w-3.5" />}
            <span>{copiedType === 'url' ? 'Link Copied' : 'Copy Proof URL'}</span>
          </button>

          <button
            onClick={onClose}
            className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-base transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

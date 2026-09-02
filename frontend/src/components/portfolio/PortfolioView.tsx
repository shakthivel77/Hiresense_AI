import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchMyPortfolio,
  fetchPublicPortfolio,
  CandidatePortfolio,
} from '../../lib/portfolioApi';
import { VerificationProofCard } from './VerificationProofCard';
import { PublicVerificationModal } from './PublicVerificationModal';
import { ProofCardModal } from './ProofCardModal';
import {
  ShieldCheck,
  Award,
  BookOpen,
  Share2,
  Check,
  Search,
  Github,
  Linkedin,
  GraduationCap,
  Layers,
} from 'lucide-react';

export const PortfolioView: React.FC = () => {
  const { user, token } = useAuth();
  const [portfolio, setPortfolio] = useState<CandidatePortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProofId, setSelectedProofId] = useState<string | null>(null);
  const [selectedEmbedProof, setSelectedEmbedProof] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [lookupInput, setLookupInput] = useState('');
  const [isViewingPublic, setIsViewingPublic] = useState(false);

  // Load candidate portfolio
  const loadMyPortfolio = async () => {
    setLoading(true);
    setError(null);
    setIsViewingPublic(false);

    try {
      if (token) {
        const data = await fetchMyPortfolio(token);
        setPortfolio(data);
      } else {
        // Fallback for unauthenticated demo viewing
        const fallbackUsername = user?.email?.split('@')[0] || 'learner';
        const data = await fetchPublicPortfolio(fallbackUsername).catch(() => null);
        if (data) {
          setPortfolio(data);
        } else {
          // Default mock portfolio for preview
          setPortfolio({
            userId: 'demo-candidate-1',
            username: 'demo_candidate',
            name: 'Demo Software Engineer',
            headline: 'Full-Stack & Cloud Engineer',
            bio: 'Computer Science Department',
            memberSince: new Date().toISOString(),
            stats: {
              totalVerifiedSkills: 0,
              totalClaimedSkills: 0,
              averageScore: 0,
              activeDomainsCount: 0,
              verificationRate: 0,
            },
            proofs: [],
            domainBreakdown: [
              { domainSlug: 'backend-developer', domainTitle: 'Backend Developer', verifiedCount: 0, totalCount: 7, completionPercentage: 0 },
              { domainSlug: 'frontend-developer', domainTitle: 'Frontend Developer', verifiedCount: 0, totalCount: 5, completionPercentage: 0 },
              { domainSlug: 'ai-data-engineer', domainTitle: 'AI & Data Engineer', verifiedCount: 0, totalCount: 6, completionPercentage: 0 },
            ],
            portfolioHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            lastUpdated: new Date().toISOString(),
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load candidate portfolio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyPortfolio();
  }, [token, user]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupInput.trim()) return;

    const term = lookupInput.trim();
    if (term.toUpperCase().startsWith('PRF-')) {
      setSelectedProofId(term.toUpperCase());
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchPublicPortfolio(term);
      setPortfolio(data);
      setIsViewingPublic(true);
    } catch (err: any) {
      setError(err.message || `No candidate found for '${term}'`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPortfolioLink = () => {
    if (!portfolio) return;
    const url = `${window.location.origin}/portfolio/${portfolio.username}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredProofs = (portfolio?.proofs || []).filter((proof) => {
    const matchesSearch =
      proof.skillName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proof.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proof.proofId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || proof.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(
    new Set((portfolio?.proofs || []).map((p) => p.category.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Controls: Recruiter Lookup & Public Share */}
      <div className="bg-surface rounded-2xl p-4 border border-border flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleLookup} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Recruiter Search: Enter @username or Proof ID (e.g. PRF-REACT-8F29A)..."
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-base border border-border rounded-xl text-xs text-primary placeholder:text-muted focus:outline-none focus:border-accent-primary transition-colors font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-elevated hover:bg-elevated/80 border border-border rounded-xl text-xs font-semibold text-primary transition-colors whitespace-nowrap"
          >
            Verify Candidate
          </button>
        </form>

        {isViewingPublic && (
          <button
            onClick={loadMyPortfolio}
            className="text-xs font-semibold text-accent-primary hover:underline whitespace-nowrap"
          >
            ← Back to My Portfolio
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center space-y-3">
          <div className="h-8 w-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted font-mono">Assembling verified competencies & signatures...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-surface rounded-2xl border border-state-error/30 space-y-3">
          <p className="text-sm font-semibold text-state-error">{error}</p>
          <button
            onClick={loadMyPortfolio}
            className="text-xs px-4 py-1.5 rounded-lg bg-accent-primary text-base font-semibold"
          >
            Reset
          </button>
        </div>
      ) : portfolio ? (
        <>
          {/* Candidate Profile Header Card */}
          <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl -z-0 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-accent-primary/20 to-state-success/20 border border-state-success/40 flex items-center justify-center text-state-success font-bold text-2xl shadow-inner">
                  {portfolio.name.charAt(0).toUpperCase()}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold text-primary">{portfolio.name}</h2>
                    <span className="text-xs font-mono text-muted bg-base px-2 py-0.5 rounded-md border border-border">
                      @{portfolio.username}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-state-success/15 text-state-success border border-state-success/30">
                      <ShieldCheck className="h-3 w-3" />
                      VERIFIED PROFILE
                    </span>
                  </div>

                  <p className="text-sm text-muted font-medium">{portfolio.headline}</p>

                  <div className="flex items-center gap-4 text-xs text-muted pt-1 flex-wrap">
                    {portfolio.bio && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5 text-accent-primary" />
                        {portfolio.bio}
                      </span>
                    )}
                    {portfolio.githubUrl && (
                      <a
                        href={portfolio.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <Github className="h-3.5 w-3.5" />
                        GitHub
                      </a>
                    )}
                    {portfolio.linkedinUrl && (
                      <a
                        href={portfolio.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <Linkedin className="h-3.5 w-3.5 text-accent-primary" />
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Share Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyPortfolioLink}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-base font-semibold text-xs transition-colors shadow-sm"
                >
                  {copiedLink ? <Check className="h-4 w-4 text-state-success" /> : <Share2 className="h-4 w-4" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Share Portfolio'}</span>
                </button>
              </div>
            </div>

            {/* Verified Metrics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-border">
              <div className="p-3.5 rounded-xl bg-base/60 border border-border">
                <span className="text-2xl font-bold font-mono text-state-success block">
                  {portfolio.stats.totalVerifiedSkills}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-muted font-mono">
                  Verified Skills
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-base/60 border border-border">
                <span className="text-2xl font-bold font-mono text-primary block">
                  {portfolio.stats.averageScore}%
                </span>
                <span className="text-[11px] uppercase tracking-wider text-muted font-mono">
                  Avg Assessment Score
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-base/60 border border-border">
                <span className="text-2xl font-bold font-mono text-accent-primary block">
                  {portfolio.stats.activeDomainsCount}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-muted font-mono">
                  Active Domains
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-base/60 border border-border">
                <span className="text-2xl font-bold font-mono text-state-warning block">
                  {portfolio.stats.verificationRate}%
                </span>
                <span className="text-[11px] uppercase tracking-wider text-muted font-mono">
                  Verification Rate
                </span>
              </div>
            </div>
          </div>

          {/* Domain Breakdown Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                <Layers className="h-4 w-4 text-accent-primary" />
                <span>Roadmap Domain Competency</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {portfolio.domainBreakdown.map((domain) => (
                <div key={domain.domainSlug} className="bg-surface rounded-2xl p-5 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-primary">{domain.domainTitle}</h4>
                    <span className="text-xs font-mono font-bold text-accent-primary">
                      {domain.completionPercentage}%
                    </span>
                  </div>

                  <div className="h-2 w-full bg-base rounded-full overflow-hidden border border-border/50">
                    <div
                      className="h-full bg-gradient-to-r from-accent-primary to-state-success transition-all duration-500"
                      style={{ width: `${domain.completionPercentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted font-mono">
                    <span>{domain.verifiedCount} / {domain.totalCount} Verified</span>
                    <span>Score &gt;= 80%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verified Proof Badges Section */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                  <Award className="h-4 w-4 text-state-success" />
                  <span>Verifiable Competency Proofs ({portfolio.proofs.length})</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Each credential has passed an authoritative timed assessment with score &gt;= 80% and is certified with a SHA-256 HMAC cryptographic signature.
                </p>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
                  <input
                    type="text"
                    placeholder="Search verified skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-base border border-border rounded-lg text-xs text-primary placeholder:text-muted focus:outline-none focus:border-accent-primary transition-colors font-mono"
                  />
                </div>

                {categories.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                        selectedCategory === 'all'
                          ? 'bg-accent-primary text-base font-semibold'
                          : 'bg-surface text-muted hover:text-primary border border-border'
                      }`}
                    >
                      All
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium capitalize transition-colors ${
                          selectedCategory === cat
                            ? 'bg-accent-primary text-base font-semibold'
                            : 'bg-surface text-muted hover:text-primary border border-border'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Proofs Grid */}
            {filteredProofs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProofs.map((proof) => (
                  <VerificationProofCard
                    key={proof.proofId}
                    proof={proof}
                    onInspectProof={(proofId) => setSelectedProofId(proofId)}
                    onOpenEmbedModal={(p) => setSelectedEmbedProof(p)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-surface rounded-2xl border border-dashed border-border space-y-3">
                <div className="inline-flex p-3 rounded-full bg-base border border-border text-muted">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h4 className="text-base font-bold text-primary">No Verified Competency Proofs Yet</h4>
                <p className="text-xs text-muted max-w-md mx-auto">
                  Take timed skill assessments on the learning roadmap. Achieving a score of 80% or higher will automatically issue an immutable cryptographic proof badge here.
                </p>
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* Recruiter Verification Modal */}
      {selectedProofId && (
        <PublicVerificationModal
          proofId={selectedProofId}
          onClose={() => setSelectedProofId(null)}
        />
      )}

      {/* Proof Badge Exporter Modal */}
      {selectedEmbedProof && (
        <ProofCardModal
          proof={selectedEmbedProof}
          onClose={() => setSelectedEmbedProof(null)}
        />
      )}
    </div>
  );
};

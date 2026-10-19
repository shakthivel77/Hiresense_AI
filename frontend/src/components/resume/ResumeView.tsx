import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Check,
  RotateCcw,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Mail,
  Layers,
  Trash2,
  Info,
} from 'lucide-react';
import {
  ResumeExtractionResult,
  ResumeSkillExtractionResponse,
  ExtractedSkillClaim,
  extractResumeText,
  extractResumeSkills,
  importSkillClaims,
} from '../../lib/resumeApi';
import { useAuth } from '../../context/AuthContext';

interface ResumeViewProps {
  onNavigateToRoadmap?: (domainSlug?: string, skillId?: string) => void;
}

const SAMPLE_RESUME = `Alex Rivera
Senior Full-Stack AI Engineer
alex.rivera@example.com | (555) 987-6543 | San Francisco, CA
https://github.com/alexrivera | https://linkedin.com/in/alexrivera | https://alexrivera.dev

PROFESSIONAL SUMMARY
Innovative software engineer with 5+ years of experience designing scalable distributed systems, responsive React applications, and PyTorch deep learning inference pipelines. Passionate about clean code, robust API security, and high-performance databases.

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python, SQL, HTML5, CSS3
Frameworks & Libraries: Node.js, Express, React, Next.js, PyTorch, Redux, Tailwind CSS
Databases & Caching: PostgreSQL, Redis Cluster, MongoDB
DevOps & Cloud: Docker, Kubernetes, CI/CD Pipelines, Git, Linux
Architecture & Security: RESTful APIs, JWT Authentication, Microservices, System Design

WORK EXPERIENCE
Lead AI Platforms Engineer | AI Scale Labs
2022 - Present | San Francisco, CA
- Architected enterprise real-time recommendation engines using PyTorch and Node.js microservices.
- Hardened backend REST API security utilizing JWT bearer authentication and role-based access control (RBAC).
- Decreased query latency by 45% through PostgreSQL indexing optimization and Redis caching layer.
- Containerized full-stack services using Docker for automated multi-stage CI/CD deployments.

Backend Systems Engineer | CloudCore Technologies
2020 - 2022 | Austin, TX
- Developed high-throughput REST APIs in Node.js and Express handling 12,000+ requests per minute.
- Maintained relational PostgreSQL schemas, migrations, and database connection pooling.
- Implemented real-time telemetry streaming and structured error logging.

EDUCATION
Bachelor of Science in Computer Science
Stanford University | 2016 - 2020

PROJECTS
SmartChat AI Platform [React, Node.js, PyTorch, Docker]
- End-to-end question-answering assistant utilizing vector embeddings and retrieval-augmented generation.
- Built responsive user interface using React and Tailwind CSS with real-time streaming responses.
`;

export const ResumeView: React.FC<ResumeViewProps> = ({ onNavigateToRoadmap }) => {
  const { token } = useAuth();

  // Mode: Upload file vs Paste text
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted data
  const [extractionResult, setExtractionResult] = useState<ResumeExtractionResult | null>(null);
  const [skillExtractionResult, setSkillExtractionResult] = useState<ResumeSkillExtractionResponse | null>(null);

  // Review & selection state for claims
  const [selectedClaimIds, setSelectedClaimIds] = useState<Set<string>>(new Set());
  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'skills' | 'sections'>('skills');

  // Import state
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<{ count: number; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 5MB limit. Please select a smaller PDF or text file.');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64Data = dataUrl.split(',')[1] || '';
      setFileBase64(base64Data);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the selected file. Please try pasting raw text instead.');
    };
    reader.readAsDataURL(file);
  };

  const handleClearInput = () => {
    setSelectedFile(null);
    setFileBase64('');
    setPastedText('');
    setExtractionResult(null);
    setSkillExtractionResult(null);
    setSelectedClaimIds(new Set());
    setImportSuccess(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = () => {
    setInputMode('paste');
    setPastedText(SAMPLE_RESUME);
    setSelectedFile(null);
    setFileBase64('');
    setErrorMessage(null);
    setImportSuccess(null);
  };

  // Main extraction routine
  const handleExtract = async () => {
    setErrorMessage(null);
    setImportSuccess(null);

    const hasText = inputMode === 'paste' && pastedText.trim().length > 0;
    const hasFile = inputMode === 'upload' && Boolean(fileBase64);

    if (!hasText && !hasFile) {
      setErrorMessage(
        inputMode === 'upload'
          ? 'Please select a resume file (PDF, TXT, MD) to extract.'
          : 'Please enter or paste your resume text before running extraction.'
      );
      return;
    }

    setIsProcessing(true);
    setProcessStep('Parsing resume structure and extracting text sections...');

    try {
      const textPayload = inputMode === 'upload'
        ? {
            fileBase64,
            mimeType: selectedFile?.type || 'application/pdf',
            fileName: selectedFile?.name,
          }
        : {
            rawText: pastedText,
            mimeType: 'text/plain',
          };

      // 1. Text & Section Extraction
      const textResult = await extractResumeText(textPayload, token);
      setExtractionResult(textResult);

      // 2. Skill Taxonomy Matching
      setProcessStep('Scanning text against Hiresense skill taxonomy...');
      const skillsResult = await extractResumeSkills(
        {
          rawText: textResult.normalizedText,
          sections: textResult.sections,
        },
        token
      );

      setSkillExtractionResult(skillsResult);

      // Default all detected skills to selected for candidate review
      const allIds = new Set(skillsResult.matchedTaxonomySkills.map((s) => s.skillId));
      setSelectedClaimIds(allIds);
      setActiveTab('skills');
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during resume extraction.');
    } finally {
      setIsProcessing(false);
      setProcessStep('');
    }
  };

  // Toggle selection for a single claim
  const toggleClaimSelection = (skillId: string) => {
    setSelectedClaimIds((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!skillExtractionResult) return;
    const filtered = getFilteredSkills();
    setSelectedClaimIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((s) => next.add(s.skillId));
      return next;
    });
  };

  const handleDeselectAll = () => {
    if (!skillExtractionResult) return;
    const filtered = getFilteredSkills();
    setSelectedClaimIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((s) => next.delete(s.skillId));
      return next;
    });
  };

  // Filter skills by domain
  const getFilteredSkills = (): ExtractedSkillClaim[] => {
    if (!skillExtractionResult) return [];
    if (domainFilter === 'ALL') {
      return skillExtractionResult.matchedTaxonomySkills;
    }
    return skillExtractionResult.matchedTaxonomySkills.filter(
      (s) => s.domainSlug === domainFilter
    );
  };

  // Import selected claims
  const handleImportClaims = async () => {
    if (!token) {
      setErrorMessage('Authentication required: please sign in to import skill claims into your profile.');
      return;
    }

    if (!skillExtractionResult || selectedClaimIds.size === 0) {
      setErrorMessage('Please select at least one skill claim to import.');
      return;
    }

    const claimsToImport = skillExtractionResult.matchedTaxonomySkills.filter((s) =>
      selectedClaimIds.has(s.skillId)
    );

    setIsImporting(true);
    setErrorMessage(null);

    try {
      const result = await importSkillClaims(claimsToImport, token);

      if (result.success) {
        setImportSuccess({
          count: result.data.importedCount,
          message: `${result.data.importedCount} skill claim${
            result.data.importedCount === 1 ? '' : 's'
          } successfully recorded in your profile as UNVERIFIED.`,
        });
      } else {
        throw new Error('Failed to import claims.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving skill claims.');
    } finally {
      setIsImporting(false);
    }
  };

  const filteredSkills = getFilteredSkills();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-primary px-2 py-0.5 rounded bg-accent-primary/10 border border-accent-primary/20">
              Unit 46–47
            </span>
            <span className="text-xs text-muted">Phase 8 Extension</span>
          </div>
          <h2 className="text-2xl font-bold text-primary mt-1 flex items-center gap-2">
            <FileText className="h-6 w-6 text-accent-primary" />
            Resume Ingestion & Skill Claims
          </h2>
          <p className="text-xs text-muted mt-1 max-w-2xl leading-relaxed">
            Extract structured contact details, work experience, and canonical technical skills from candidate resumes.
            All extracted competencies are strictly registered as self-asserted unverified claims.
          </p>
        </div>

        <button
          onClick={handleLoadSample}
          className="flex items-center gap-2 text-xs bg-elevated hover:bg-elevated/80 border border-border text-primary px-3 py-2 rounded-lg transition-colors whitespace-nowrap self-start"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent-secondary" />
          <span>Load Sample Resume</span>
        </button>
      </div>

      {/* Critical Invariant Callout */}
      <div className="bg-amber-950/20 border border-state-warning/30 rounded-xl p-4 flex items-start gap-3.5 text-xs">
        <ShieldAlert className="h-5 w-5 text-state-warning flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-state-warning">
            Core System Invariant: Self-Declared Skill Claims
          </p>
          <p className="text-muted leading-relaxed">
            Skills extracted from resumes are treated strictly as <strong className="text-primary font-mono">UNVERIFIED</strong> self-claims.
            Resume claims <strong className="text-state-warning">never</strong> grant verified status, advance prerequisite unlocking, or increase your verified competency score until validated via an authoritative <span className="text-primary font-mono">&gt;= 80.0%</span> proctored assessment.
          </p>
        </div>
      </div>

      {/* Input Section Card */}
      <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setInputMode('upload')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                inputMode === 'upload'
                  ? 'bg-elevated text-accent-primary border border-accent-primary/30'
                  : 'text-muted hover:text-primary'
              }`}
            >
              Upload Resume (PDF / TXT)
            </button>
            <button
              onClick={() => setInputMode('paste')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                inputMode === 'paste'
                  ? 'bg-elevated text-accent-primary border border-accent-primary/30'
                  : 'text-muted hover:text-primary'
              }`}
            >
              Paste Resume Text
            </button>
          </div>

          {(selectedFile || pastedText) && (
            <button
              onClick={handleClearInput}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-state-error transition-colors px-2 py-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Upload Mode */}
        {inputMode === 'upload' ? (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,text/plain,application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="resume-file-input"
            />
            <label
              htmlFor="resume-file-input"
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                selectedFile
                  ? 'border-accent-primary/40 bg-accent-primary/5'
                  : 'border-border hover:border-accent-primary/30 hover:bg-elevated/40'
              }`}
            >
              <UploadCloud
                className={`h-10 w-10 ${
                  selectedFile ? 'text-accent-primary' : 'text-muted'
                }`}
              />
              <div className="text-center">
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-semibold text-primary">{selectedFile.name}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Ready for extraction
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-primary">
                      Click to select or drag and drop your resume file
                    </p>
                    <p className="text-xs text-muted mt-1">
                      Supports PDF, Plain Text (.txt), and Markdown (.md) up to 5MB
                    </p>
                  </div>
                )}
              </div>
            </label>
          </div>
        ) : (
          /* Paste Mode */
          <div className="space-y-2">
            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste plain text resume here, including Contact, Summary, Experience, and Technical Skills..."
              className="w-full bg-base border border-border rounded-lg p-3 text-xs font-mono text-primary placeholder-muted focus:outline-none focus:border-accent-primary transition-colors resize-y"
            />
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>Characters: {pastedText.length}</span>
              <span>Normalized line breaks will be applied automatically</span>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            <span>Deterministic keyword & alias taxonomy matching (0 cloud API cost)</span>
          </div>

          <button
            onClick={handleExtract}
            disabled={isProcessing || (inputMode === 'upload' ? !selectedFile : !pastedText.trim())}
            className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-base font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors"
          >
            {isProcessing ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Extract Resume & Skills</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="p-3 bg-elevated/70 rounded-lg border border-accent-primary/30 flex items-center gap-3 text-xs text-accent-primary animate-pulse">
            <RotateCcw className="h-4 w-4 animate-spin flex-shrink-0" />
            <span>{processStep || 'Processing resume payload...'}</span>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 bg-state-error/10 rounded-lg border border-state-error/30 flex items-start gap-2.5 text-xs text-state-error">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Import Success Notification */}
        {importSuccess && (
          <div className="p-4 bg-state-success/10 rounded-lg border border-state-success/30 flex items-center justify-between gap-3 text-xs text-state-success">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">{importSuccess.message}</p>
                <p className="text-[11px] text-muted mt-0.5">
                  These claims are now visible in your skill profile. Head to the Roadmap to begin verifying them.
                </p>
              </div>
            </div>
            {onNavigateToRoadmap && (
              <button
                onClick={() => onNavigateToRoadmap()}
                className="flex items-center gap-1.5 bg-state-success/20 hover:bg-state-success/30 text-state-success px-3 py-1.5 rounded-md font-semibold text-xs transition-colors whitespace-nowrap"
              >
                <span>View Roadmap</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Extracted Output Section */}
      {(extractionResult || skillExtractionResult) && (
        <div className="space-y-4">
          {/* View Tabs */}
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('skills')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'skills'
                    ? 'bg-elevated text-accent-primary border border-accent-primary/30'
                    : 'text-muted hover:text-primary'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Extracted Skill Claims</span>
                {skillExtractionResult && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-accent-primary/20 text-accent-primary font-mono">
                    {skillExtractionResult.totalClaimsFound}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('sections')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'sections'
                    ? 'bg-elevated text-accent-primary border border-accent-primary/30'
                    : 'text-muted hover:text-primary'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Parsed Resume Structure</span>
              </button>
            </div>

            {/* Quick Summary Pill */}
            {extractionResult && (
              <span className="text-[11px] text-muted font-mono hidden sm:inline">
                {extractionResult.rawTextLength} chars extracted • {skillExtractionResult?.matchedTaxonomySkills.length || 0} taxonomy matches
              </span>
            )}
          </div>

          {/* TAB 1: SKILL CLAIMS REVIEW */}
          {activeTab === 'skills' && skillExtractionResult && (
            <div className="space-y-4">
              {/* Filter and Bulk Action Bar */}
              <div className="bg-surface rounded-xl border border-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted mr-1 font-medium">Domain:</span>
                  {[
                    { id: 'ALL', label: 'All Domains' },
                    { id: 'backend-developer', label: 'Backend' },
                    { id: 'frontend-developer', label: 'Frontend' },
                    { id: 'ai-data-engineer', label: 'AI & Data' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setDomainFilter(filter.id)}
                      className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                        domainFilter === filter.id
                          ? 'bg-accent-primary text-base font-semibold'
                          : 'bg-elevated text-muted hover:text-primary border border-border'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-muted hover:text-primary px-2.5 py-1 rounded bg-elevated border border-border transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="text-xs text-muted hover:text-primary px-2.5 py-1 rounded bg-elevated border border-border transition-colors"
                  >
                    Deselect All
                  </button>
                  <button
                    onClick={handleImportClaims}
                    disabled={isImporting || selectedClaimIds.size === 0}
                    className="flex items-center gap-1.5 bg-state-warning hover:bg-state-warning/90 disabled:opacity-50 disabled:cursor-not-allowed text-base font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors ml-2"
                  >
                    {isImporting ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Import Claims ({selectedClaimIds.size})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Skills Grid */}
              {filteredSkills.length === 0 ? (
                <div className="p-8 text-center bg-surface rounded-xl border border-border text-muted text-xs">
                  No skills detected for the selected domain filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredSkills.map((claim) => {
                    const isSelected = selectedClaimIds.has(claim.skillId);
                    return (
                      <div
                        key={claim.skillId}
                        onClick={() => toggleClaimSelection(claim.skillId)}
                        className={`bg-surface rounded-xl p-4 border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'border-accent-primary/60 bg-elevated/80 shadow-sm'
                            : 'border-border hover:border-border/80 opacity-70'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleClaimSelection(claim.skillId)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4 rounded border-border text-accent-primary focus:ring-0 cursor-pointer"
                              />
                              <h4 className="text-sm font-bold text-primary">{claim.skillName}</h4>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-state-warning font-semibold uppercase whitespace-nowrap">
                              UNVERIFIED
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="font-mono text-muted bg-base px-1.5 py-0.5 rounded border border-border">
                              {claim.skillId}
                            </span>
                            <span className="text-accent-secondary bg-accent-secondary/10 px-1.5 py-0.5 rounded border border-accent-secondary/20">
                              {claim.category}
                            </span>
                            <span className="text-muted capitalize bg-base px-1.5 py-0.5 rounded border border-border">
                              {claim.difficulty}
                            </span>
                          </div>

                          <p className="text-[11px] text-muted italic line-clamp-2">
                            {claim.mentionContext || `Matched via ${claim.matchType} matching`}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted">
                          <span className="capitalize">
                            Source: {claim.extractedFrom.replace('_', ' ')}
                          </span>
                          <span className="font-mono text-accent-primary">
                            {(claim.confidence * 100).toFixed(0)}% Confidence
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PARSED RESUME SECTIONS */}
          {activeTab === 'sections' && extractionResult && (
            <div className="space-y-4">
              {/* Contact Info Card */}
              <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-accent-primary" />
                  Candidate Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-muted text-[10px] uppercase">Name</span>
                    <p className="font-semibold text-primary">{extractionResult.sections.contact.name || 'Not detected'}</p>
                  </div>
                  <div>
                    <span className="text-muted text-[10px] uppercase">Email</span>
                    <p className="font-semibold text-primary">{extractionResult.sections.contact.email || 'Not detected'}</p>
                  </div>
                  <div>
                    <span className="text-muted text-[10px] uppercase">Phone</span>
                    <p className="font-semibold text-primary">{extractionResult.sections.contact.phone || 'Not detected'}</p>
                  </div>
                  <div>
                    <span className="text-muted text-[10px] uppercase">GitHub</span>
                    <p className="font-semibold text-accent-primary truncate">
                      {extractionResult.sections.contact.githubUrl ? (
                        <a href={extractionResult.sections.contact.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {extractionResult.sections.contact.githubUrl}
                        </a>
                      ) : (
                        'Not detected'
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted text-[10px] uppercase">LinkedIn</span>
                    <p className="font-semibold text-accent-primary truncate">
                      {extractionResult.sections.contact.linkedinUrl ? (
                        <a href={extractionResult.sections.contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {extractionResult.sections.contact.linkedinUrl}
                        </a>
                      ) : (
                        'Not detected'
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted text-[10px] uppercase">Portfolio</span>
                    <p className="font-semibold text-accent-primary truncate">
                      {extractionResult.sections.contact.portfolioUrl ? (
                        <a href={extractionResult.sections.contact.portfolioUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {extractionResult.sections.contact.portfolioUrl}
                        </a>
                      ) : (
                        'Not detected'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {extractionResult.sections.summary && (
                <div className="bg-surface rounded-xl border border-border p-5 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Summary</h3>
                  <p className="text-xs text-primary leading-relaxed">{extractionResult.sections.summary}</p>
                </div>
              )}

              {/* Experience */}
              <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-accent-secondary" />
                  Work Experience ({extractionResult.sections.experience.length})
                </h3>
                {extractionResult.sections.experience.length === 0 ? (
                  <p className="text-xs text-muted">No structured experience entries parsed.</p>
                ) : (
                  <div className="space-y-4">
                    {extractionResult.sections.experience.map((exp, idx) => (
                      <div key={idx} className="bg-elevated/50 p-4 rounded-lg border border-border space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-primary">{exp.role}</h4>
                          <span className="text-[10px] text-muted font-mono">{exp.duration}</span>
                        </div>
                        <p className="text-xs text-accent-primary font-medium">{exp.company}</p>
                        {exp.bullets.length > 0 && (
                          <ul className="list-disc list-inside text-xs text-muted space-y-1 pt-1">
                            {exp.bullets.map((b, bIdx) => (
                              <li key={bIdx} className="leading-relaxed">
                                {b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Education */}
              <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                  <GraduationCap className="h-3.5 w-3.5 text-state-success" />
                  Education
                </h3>
                {extractionResult.sections.education.length === 0 ? (
                  <p className="text-xs text-muted">No education entries parsed.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {extractionResult.sections.education.map((edu, idx) => (
                      <div key={idx} className="bg-elevated/50 p-3.5 rounded-lg border border-border">
                        <p className="text-xs font-bold text-primary">{edu.institution}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                        </p>
                        {edu.year && <p className="text-[10px] text-muted font-mono mt-1">{edu.year}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Projects */}
              {extractionResult.sections.projects.length > 0 && (
                <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                    <FolderGit2 className="h-3.5 w-3.5 text-accent-primary" />
                    Projects ({extractionResult.sections.projects.length})
                  </h3>
                  <div className="space-y-3">
                    {extractionResult.sections.projects.map((proj, idx) => (
                      <div key={idx} className="bg-elevated/50 p-3.5 rounded-lg border border-border space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-primary">{proj.title}</h4>
                          <div className="flex flex-wrap gap-1">
                            {proj.technologies.map((tech, tIdx) => (
                              <span key={tIdx} className="text-[10px] bg-base border border-border px-1.5 py-0.5 rounded text-accent-primary font-mono">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted leading-relaxed">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

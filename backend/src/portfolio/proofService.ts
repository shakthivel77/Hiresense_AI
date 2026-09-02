import { createHmac, randomUUID, randomBytes } from 'crypto';
import {
  VerificationProofDTO,
  PublicProofCardDTO,
  CreateProofParams,
} from './types.js';
import { roadmapService } from '../roadmap/service.js';
import { isSupabaseConfigured, getSupabaseClient } from '../common/supabase.js';

const PROOF_SECRET_KEY = process.env.PROOF_SECRET_KEY || 'hiresense_ai_immutable_proof_signature_key_2026';

export class ProofService {
  private proofsMap = new Map<string, VerificationProofDTO>(); // proofId -> Proof
  private userProofsMap = new Map<string, string[]>(); // userId -> proofId[]
  private idToProofIdMap = new Map<string, string>(); // internal id -> proofId

  /**
   * Cryptographically generate a tamper-evident SHA-256 HMAC verification signature
   */
  public generateProofHash(
    userId: string,
    skillId: string,
    score: number,
    attemptId: string,
    verificationDate: string
  ): string {
    const rawData = `${userId}:${skillId}:${score}:${attemptId}:${verificationDate}`;
    return createHmac('sha256', PROOF_SECRET_KEY).update(rawData).digest('hex');
  }

  /**
   * Generate human-readable shareable Proof ID (e.g. PRF-REACT-8F29A)
   */
  public generateProofId(skillId: string): string {
    const cleanSlug = skillId
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 6);
    const suffix = randomBytes(3).toString('hex').toUpperCase();
    return `PRF-${cleanSlug}-${suffix}`;
  }

  /**
   * Create and record an immutable Verification Proof Artifact
   * Invariant: Requires score >= 80.0
   */
  public async createProofArtifact(params: CreateProofParams): Promise<VerificationProofDTO> {
    if (params.score < 80.0) {
      throw new Error(
        `Cannot issue verification proof: score ${params.score}% is below authoritative threshold (80%).`
      );
    }

    const skillMeta = roadmapService.getSkillById(params.skillId);
    const skillName = skillMeta
      ? skillMeta.name
      : params.skillId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const category = skillMeta ? skillMeta.category : 'core';
    const difficulty = skillMeta ? skillMeta.difficulty : 'intermediate';

    const verificationDate = params.verificationDate || new Date().toISOString();
    const proofId = this.generateProofId(params.skillId);
    const id = randomUUID();

    const verificationHash = this.generateProofHash(
      params.userId,
      params.skillId,
      params.score,
      params.attemptId,
      verificationDate
    );

    const proof: VerificationProofDTO = {
      id,
      proofId,
      userId: params.userId,
      candidateName: params.candidateName || 'Candidate',
      candidateEmail: params.candidateEmail,
      skillId: params.skillId,
      skillName,
      category,
      difficulty,
      score: params.score,
      passingScore: 80.0,
      attemptId: params.attemptId,
      verificationDate,
      verificationHash,
      issuer: 'Hiresense_AI Verification Authority',
      status: 'VALID',
      proofUrl: `/verify/${proofId}`,
    };

    this.proofsMap.set(proof.proofId, proof);
    this.idToProofIdMap.set(proof.id, proof.proofId);

    const userList = this.userProofsMap.get(params.userId) || [];
    userList.push(proof.proofId);
    this.userProofsMap.set(params.userId, userList);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        await supabase.from('verification_proofs').upsert({
          id: proof.id,
          proof_id: proof.proofId,
          user_id: proof.userId,
          skill_id: proof.skillId,
          score: proof.score,
          attempt_id: proof.attemptId,
          verification_date: proof.verificationDate,
          verification_hash: proof.verificationHash,
          issuer: proof.issuer,
          status: proof.status,
        });
      } catch (err) {
        console.warn('[ProofService] Supabase sync deferred:', err);
      }
    }

    return proof;
  }

  /**
   * Verify the cryptographic signature of a proof artifact
   */
  public verifyProofIntegrity(proof: VerificationProofDTO): boolean {
    if (proof.status !== 'VALID') return false;
    const expectedHash = this.generateProofHash(
      proof.userId,
      proof.skillId,
      proof.score,
      proof.attemptId,
      proof.verificationDate
    );
    return expectedHash === proof.verificationHash;
  }

  /**
   * Retrieve proof record by shareable Proof ID
   */
  public async getProofByProofId(proofId: string): Promise<VerificationProofDTO | null> {
    const formattedId = proofId.trim().toUpperCase();
    return this.proofsMap.get(formattedId) || null;
  }

  /**
   * Retrieve all proof records for a candidate
   */
  public async getUserProofs(userId: string): Promise<VerificationProofDTO[]> {
    const proofIds = this.userProofsMap.get(userId) || [];
    return proofIds
      .map((id) => this.proofsMap.get(id))
      .filter((p): p is VerificationProofDTO => Boolean(p));
  }

  /**
   * Retrieve public proof card representation for external verification
   */
  public async getPublicProofCard(proofId: string): Promise<PublicProofCardDTO | null> {
    const proof = await this.getProofByProofId(proofId);
    if (!proof) return null;

    const isValid = this.verifyProofIntegrity(proof);

    return {
      proofId: proof.proofId,
      candidateName: proof.candidateName,
      skillName: proof.skillName,
      category: proof.category,
      difficulty: proof.difficulty,
      score: proof.score,
      verificationDate: proof.verificationDate,
      verificationHash: proof.verificationHash,
      issuer: proof.issuer,
      status: proof.status,
      verified: isValid && proof.status === 'VALID',
    };
  }

  /**
   * Generate standalone SVG verifiable badge card for embedding in GitHub READMEs / websites
   */
  public generateProofBadgeSvg(card: PublicProofCardDTO): string {
    const dateFormatted = new Date(card.verificationDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const hashSnippet = card.verificationHash.slice(0, 20) + '...';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 260" width="500" height="260" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c0d0e"/>
      <stop offset="100%" stop-color="#15181c"/>
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <style>
    .font-sans { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  </style>

  <!-- Card Background -->
  <rect x="10" y="10" width="480" height="240" rx="16" fill="url(#bgGrad)" stroke="#24282e" stroke-width="1.5" filter="url(#cardShadow)"/>

  <!-- Top Accent Glow Line -->
  <path d="M 30 10 L 470 10" stroke="url(#emeraldGrad)" stroke-width="2" stroke-linecap="round"/>

  <!-- Brand Header -->
  <g transform="translate(32, 38)">
    <rect x="0" y="0" width="24" height="24" rx="6" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-width="1.2"/>
    <path d="M 6 12 L 10 16 L 18 8" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="32" y="16" fill="#f8fafc" class="font-sans" font-weight="700" font-size="13" letter-spacing="0.5">HIRESENSE_AI</text>
    <text x="135" y="16" fill="#64748b" class="font-mono" font-size="10">|</text>
    <text x="145" y="16" fill="#10b981" class="font-mono" font-weight="700" font-size="10" letter-spacing="1">VERIFIED COMPETENCY</text>
  </g>

  <!-- Score Badge Top Right -->
  <g transform="translate(370, 32)">
    <rect x="0" y="0" width="98" height="30" rx="8" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-width="1"/>
    <text x="49" y="19" text-anchor="middle" fill="#10b981" class="font-mono" font-weight="700" font-size="13">${card.score}% SCORE</text>
  </g>

  <!-- Skill Title & Category -->
  <g transform="translate(32, 95)">
    <rect x="0" y="0" width="auto" height="18" rx="4" fill="#6366f1" fill-opacity="0.15"/>
    <text x="0" y="12" fill="#818cf8" class="font-mono" font-size="10" font-weight="600" letter-spacing="0.5">${card.category.toUpperCase()} • ${card.difficulty.toUpperCase()}</text>
    <text x="0" y="42" fill="#ffffff" class="font-sans" font-size="22" font-weight="800" letter-spacing="-0.5">${card.skillName}</text>
    <text x="0" y="65" fill="#94a3b8" class="font-sans" font-size="12">Candidate: <tspan fill="#f1f5f9" font-weight="600">${card.candidateName}</tspan></text>
  </g>

  <!-- Divider -->
  <line x1="32" y1="185" x2="468" y2="185" stroke="#24282e" stroke-width="1"/>

  <!-- Footer Info -->
  <g transform="translate(32, 212)">
    <text x="0" y="0" fill="#64748b" class="font-mono" font-size="10">PROOF ID: <tspan fill="#e2e8f0" font-weight="600">${card.proofId}</tspan></text>
    <text x="0" y="16" fill="#64748b" class="font-mono" font-size="9">HMAC: <tspan fill="#94a3b8">${hashSnippet}</tspan></text>
  </g>

  <g transform="translate(468, 212)">
    <text x="0" y="0" text-anchor="end" fill="#64748b" class="font-mono" font-size="10">VERIFIED ON: <tspan fill="#e2e8f0">${dateFormatted}</tspan></text>
    <text x="0" y="16" text-anchor="end" fill="#10b981" class="font-mono" font-size="9">✓ AUTHENTIC &amp; TAMPER-EVIDENT</text>
  </g>
</svg>`;
  }
}

export const proofService = new ProofService();

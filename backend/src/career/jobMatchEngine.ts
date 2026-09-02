import {
  JobPostingDTO,
  JobMatchAnalysisDTO,
  MatchedSkillItem,
  JobSkillRequirementDTO,
  ReadinessTier,
} from './types.js';
import { skillService } from '../skills/service.js';
import { proofService } from '../portfolio/proofService.js';
import { jobExtractorService } from './jobExtractorService.js';

export class JobMatchEngine {
  /**
   * Deterministically calculate candidate job match analysis against a structured job posting
   */
  public async calculateJobMatch(
    userId: string,
    job: JobPostingDTO
  ): Promise<JobMatchAnalysisDTO> {
    const userSkills = await skillService.getUserSkills(userId);
    const userProofs = await proofService.getUserProofs(userId);

    const userSkillMap = new Map(userSkills.map((s) => [s.skillId, s]));
    const userProofMap = new Map(userProofs.map((p) => [p.skillId, p]));

    const allRequirements: JobSkillRequirementDTO[] = [
      ...job.requiredSkills,
      ...job.preferredSkills,
    ];

    const matchedItems: MatchedSkillItem[] = [];
    const missingItems: MatchedSkillItem[] = [];

    let totalRequiredWeight = 0;
    let earnedRequiredWeight = 0;
    let requiredSkillsMet = 0;

    let totalPreferredWeight = 0;
    let earnedPreferredWeight = 0;
    let preferredSkillsMet = 0;

    for (const req of allRequirements) {
      const isReq = req.importance === 'REQUIRED';
      const weight = isReq ? 1.0 : 0.5;

      if (isReq) {
        totalRequiredWeight += weight;
      } else {
        totalPreferredWeight += weight;
      }

      const userSkill = userSkillMap.get(req.skillId);
      const userProof = userProofMap.get(req.skillId);

      let status: 'VERIFIED' | 'CLAIMED' | 'MISSING' = 'MISSING';
      let isVerified = false;
      let verificationScore: number | null = null;
      let proofId: string | null = null;
      let earnedWeight = 0;

      if (userSkill && userSkill.status === 'VERIFIED') {
        status = 'VERIFIED';
        isVerified = true;
        verificationScore = userSkill.verificationScore || 85.0;
        proofId = userProof ? userProof.proofId : null;
        // Deterministic proportional score weight formula
        earnedWeight = Math.round(weight * (verificationScore / 100) * 100) / 100;

        if (isReq) {
          earnedRequiredWeight += earnedWeight;
          requiredSkillsMet++;
        } else {
          earnedPreferredWeight += earnedWeight;
          preferredSkillsMet++;
        }
      } else if (userSkill && userSkill.status === 'CLAIMED') {
        status = 'CLAIMED';
        isVerified = false;
        verificationScore = null;
        earnedWeight = 0; // Invariant: Claimed skills earn 0 verified score
      } else {
        status = 'MISSING';
        isVerified = false;
        verificationScore = null;
        earnedWeight = 0;
      }

      const item: MatchedSkillItem = {
        requirementId: req.id,
        skillId: req.skillId,
        skillName: req.skillName,
        category: req.category,
        importance: req.importance,
        weight,
        status,
        isVerified,
        verificationScore,
        proofId,
        earnedWeight,
      };

      if (isVerified) {
        matchedItems.push(item);
      } else {
        missingItems.push(item);
      }
    }

    const totalWeight = totalRequiredWeight + totalPreferredWeight;
    const earnedTotalWeight = earnedRequiredWeight + earnedPreferredWeight;

    const matchScore =
      totalWeight > 0 ? Math.round((earnedTotalWeight / totalWeight) * 100) : 0;

    const requiredMatchScore =
      totalRequiredWeight > 0
        ? Math.round((earnedRequiredWeight / totalRequiredWeight) * 100)
        : 0;

    const preferredMatchScore =
      totalPreferredWeight > 0
        ? Math.round((earnedPreferredWeight / totalPreferredWeight) * 100)
        : 100;

    let readinessTier: ReadinessTier = 'DEVELOPING';
    if (matchScore >= 80) {
      readinessTier = 'HIGH';
    } else if (matchScore >= 60) {
      readinessTier = 'MODERATE';
    } else if (matchScore >= 40) {
      readinessTier = 'LOW';
    } else {
      readinessTier = 'DEVELOPING';
    }

    return {
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      domainSlug: job.domainSlug,
      matchScore,
      requiredMatchScore,
      preferredMatchScore,
      requiredSkillsTotal: job.requiredSkills.length,
      requiredSkillsMet,
      preferredSkillsTotal: job.preferredSkills.length,
      preferredSkillsMet,
      readinessTier,
      matchedSkills: matchedItems,
      missingSkills: missingItems,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Parse raw job text and compute match analysis on the fly
   */
  public async calculateMatchFromText(
    userId: string,
    rawText: string,
    domainSlug?: string
  ): Promise<JobMatchAnalysisDTO> {
    const extracted = jobExtractorService.extractSkillsFromText(rawText, domainSlug);

    const syntheticJob: JobPostingDTO = {
      id: 'custom-input',
      title: 'Custom Job Description',
      company: 'Target Employer',
      location: 'Remote',
      employmentType: 'full-time',
      experienceLevel: 'mid',
      domainSlug: extracted.detectedDomainSlug,
      rawDescription: rawText,
      requiredSkills: extracted.requiredSkills,
      preferredSkills: extracted.preferredSkills,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.calculateJobMatch(userId, syntheticJob);
  }
}

export const jobMatchEngine = new JobMatchEngine();

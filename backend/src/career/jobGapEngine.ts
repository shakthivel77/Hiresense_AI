import {
  JobMatchAnalysisDTO,
  CareerGapAnalysisDTO,
  SkillGapRecommendationDTO,
  PrerequisiteStepDTO,
  GapPriority,
} from './types.js';
import { roadmapService } from '../roadmap/service.js';
import { skillService } from '../skills/service.js';

export class JobGapEngine {
  /**
   * Generate actionable, prioritized career gap recommendations based on deterministic roadmap DAG traversal
   */
  public async generateGapAnalysis(
    userId: string,
    jobMatch: JobMatchAnalysisDTO
  ): Promise<CareerGapAnalysisDTO> {
    const userSkills = await skillService.getUserSkills(userId);
    const verifiedSkillIds = new Set<string>(
      userSkills.filter((s) => s.status === 'VERIFIED').map((s) => s.skillId)
    );

    const allDeps = roadmapService.getDependencies();

    // Total possible job weight
    const totalJobWeight =
      jobMatch.requiredSkillsTotal * 1.0 + jobMatch.preferredSkillsTotal * 0.5;

    const recommendations: SkillGapRecommendationDTO[] = [];

    for (const missing of jobMatch.missingSkills) {
      // 1. Traverse DAG for direct and upstream prerequisites
      const directPrereqIds = allDeps
        .filter((d) => d.skillId === missing.skillId)
        .map((d) => d.prerequisiteSkillId);

      const isReadyToAssess =
        directPrereqIds.length === 0 ||
        directPrereqIds.every((id) => verifiedSkillIds.has(id));

      // Build complete prerequisite chain
      const chainSkillIds = this.resolvePrerequisiteChain(missing.skillId, allDeps);
      const prerequisiteChain: PrerequisiteStepDTO[] = chainSkillIds.map((pId) => {
        const pMeta = roadmapService.getSkillById(pId);
        const pVerified = verifiedSkillIds.has(pId);

        let status: 'VERIFIED' | 'AVAILABLE' | 'LOCKED' = 'LOCKED';
        if (pVerified) {
          status = 'VERIFIED';
        } else {
          const directOfP = allDeps
            .filter((d) => d.skillId === pId)
            .map((d) => d.prerequisiteSkillId);
          if (directOfP.length === 0 || directOfP.every((id) => verifiedSkillIds.has(id))) {
            status = 'AVAILABLE';
          } else {
            status = 'LOCKED';
          }
        }

        return {
          skillId: pId,
          skillName: pMeta ? pMeta.name : pId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          category: pMeta ? pMeta.category : 'core',
          isVerified: pVerified,
          status,
        };
      });

      const unverifiedPrereqs = prerequisiteChain.filter((p) => !p.isVerified);
      const missingPrerequisiteCount = unverifiedPrereqs.length;

      // 2. Score potential gain calculation
      const scorePotentialGain =
        totalJobWeight > 0
          ? Math.round((missing.weight / totalJobWeight) * 100)
          : 0;

      // 3. Priority tier assignment
      let priority: GapPriority = 'LOW_PRIORITY';
      if (missing.importance === 'REQUIRED') {
        if (isReadyToAssess) {
          priority = 'IMMEDIATE_QUICK_WIN';
        } else if (missingPrerequisiteCount <= 1) {
          priority = 'HIGH_PRIORITY';
        } else {
          priority = 'MEDIUM_PRIORITY';
        }
      } else {
        if (isReadyToAssess) {
          priority = 'HIGH_PRIORITY';
        } else {
          priority = 'LOW_PRIORITY';
        }
      }

      // 4. Action tip formulation
      let actionTip = '';
      if (isReadyToAssess) {
        actionTip = `Prerequisites satisfied! You can take the 15-min assessment now to immediately boost your match score by +${scorePotentialGain}%.`;
      } else {
        const nextSteps = unverifiedPrereqs
          .filter((p) => p.status === 'AVAILABLE')
          .map((p) => `'${p.skillName}'`)
          .join(' and ');

        if (nextSteps) {
          actionTip = `Prerequisite path required: first complete and verify ${nextSteps} on your roadmap.`;
        } else {
          actionTip = `Unmet dependency chain (${missingPrerequisiteCount} skills). Follow the roadmap path to unlock this competency.`;
        }
      }

      recommendations.push({
        skillId: missing.skillId,
        skillName: missing.skillName,
        category: missing.category,
        importance: missing.importance,
        weight: missing.weight,
        scorePotentialGain,
        priority,
        isReadyToAssess,
        missingPrerequisiteCount,
        prerequisiteChain,
        domainSlug: jobMatch.domainSlug,
        roadmapUrl: `/roadmap?domain=${jobMatch.domainSlug}&skill=${missing.skillId}`,
        actionTip,
      });
    }

    // Sort priority order: Quick Win > High > Medium > Low (and higher gain first)
    const priorityWeight: Record<GapPriority, number> = {
      IMMEDIATE_QUICK_WIN: 4,
      HIGH_PRIORITY: 3,
      MEDIUM_PRIORITY: 2,
      LOW_PRIORITY: 1,
    };

    recommendations.sort((a, b) => {
      const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (pDiff !== 0) return pDiff;
      return b.scorePotentialGain - a.scorePotentialGain;
    });

    const quickWinsCount = recommendations.filter((r) => r.isReadyToAssess).length;
    const blockedGapsCount = recommendations.length - quickWinsCount;

    return {
      jobMatch,
      totalGapsCount: recommendations.length,
      quickWinsCount,
      blockedGapsCount,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Helper to recursively collect all ordered prerequisite ancestors for a skill
   */
  private resolvePrerequisiteChain(
    targetSkillId: string,
    allDeps: Array<{ skillId: string; prerequisiteSkillId: string }>
  ): string[] {
    const visited = new Set<string>();
    const chain: string[] = [];

    const traverse = (skillId: string) => {
      const prereqs = allDeps
        .filter((d) => d.skillId === skillId)
        .map((d) => d.prerequisiteSkillId);

      for (const pId of prereqs) {
        if (!visited.has(pId) && pId !== targetSkillId) {
          visited.add(pId);
          traverse(pId);
          chain.push(pId);
        }
      }
    };

    traverse(targetSkillId);
    return chain;
  }
}

export const jobGapEngine = new JobGapEngine();

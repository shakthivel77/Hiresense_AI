import { randomUUID } from 'crypto';
import { roadmapService } from '../roadmap/service.js';
import { isSupabaseConfigured, getSupabaseClient } from '../common/supabase.js';
import {
  UserSkillDTO,
  UserSkillStatus,
  ComputedSkillState,
  UserSkillGraphNode,
  UserRoadmapStateDTO,
  VerifiedSkillProfileDTO,
  VerifiedSkillItemDTO,
  DomainProgressDTO,
} from './types.js';

export class SkillService {
  // In-memory store of user skills for development / fast retrieval
  private userSkillsMap = new Map<string, UserSkillDTO>();

  /**
   * Get all user skill records for a given user
   */
  public async getUserSkills(userId: string): Promise<UserSkillDTO[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('user_skills')
          .select('*')
          .eq('user_id', userId);

        if (!error && data) {
          return data.map((row) => this.mapDbRowToUserSkill(row));
        }
      } catch (err) {
        console.warn('[SkillService] Supabase query failed, using in-memory store:', err);
      }
    }

    return Array.from(this.userSkillsMap.values()).filter((us) => us.userId === userId);
  }

  /**
   * Get a single user skill record by userId and skillId
   */
  public async getUserSkill(userId: string, skillId: string): Promise<UserSkillDTO | null> {
    const all = await this.getUserSkills(userId);
    return all.find((us) => us.skillId === skillId) || null;
  }

  /**
   * Get all verified skills for a user (Cross-Domain Reuse)
   */
  public async getUserVerifiedSkills(userId: string): Promise<UserSkillDTO[]> {
    const skills = await this.getUserSkills(userId);
    return skills.filter((s) => s.status === 'VERIFIED');
  }

  /**
   * Get aggregated Verified Skill Profile for candidate
   */
  public async getVerifiedSkillProfile(userId: string): Promise<VerifiedSkillProfileDTO> {
    const allUserSkills = await this.getUserSkills(userId);
    const verifiedUserSkills = allUserSkills.filter((s) => s.status === 'VERIFIED');
    const claimedSkills = allUserSkills.filter((s) => s.status === 'CLAIMED' || s.status === 'UNVERIFIED');

    const verifiedSkills: VerifiedSkillItemDTO[] = [];
    const verifiedSkillIds = new Set<string>();

    for (const us of verifiedUserSkills) {
      verifiedSkillIds.add(us.skillId);
      const skillMeta = roadmapService.getSkillById(us.skillId);
      verifiedSkills.push({
        skillId: us.skillId,
        skillName: skillMeta ? skillMeta.name : us.skillId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        category: skillMeta ? skillMeta.category : 'core',
        difficulty: skillMeta ? skillMeta.difficulty : 'intermediate',
        verificationScore: us.verificationScore || 80,
        verificationDate: us.verificationDate || us.updatedAt,
      });
    }

    // Compute domain breakdown
    const domains = await roadmapService.getDomains();
    const domainBreakdown: DomainProgressDTO[] = [];

    for (const domain of domains) {
      const graph = await roadmapService.getRoadmapGraph(domain.slug);
      if (graph) {
        const totalCount = graph.nodes.length;
        const verifiedCount = graph.nodes.filter((n) => verifiedSkillIds.has(n.skill.id)).length;
        const completionPercentage = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

        domainBreakdown.push({
          domainSlug: domain.slug,
          domainTitle: domain.name,
          verifiedCount,
          totalCount,
          completionPercentage,
        });
      }
    }

    const totalTracked = allUserSkills.length;
    const verificationRate = totalTracked > 0 ? Math.round((verifiedUserSkills.length / totalTracked) * 100) : 0;

    return {
      userId,
      totalVerifiedSkills: verifiedSkills.length,
      totalClaimedSkills: claimedSkills.length,
      verificationRate,
      verifiedSkills,
      domainBreakdown,
    };
  }

  /**
   * Calculate deterministic roadmap state for a user in a given domain
   */
  public async getUserRoadmapState(
    userId: string,
    domainSlug: string
  ): Promise<UserRoadmapStateDTO | null> {
    const graph = await roadmapService.getRoadmapGraph(domainSlug);
    if (!graph) return null;

    const userSkills = await this.getUserSkills(userId);
    const userSkillBySkillId = new Map<string, UserSkillDTO>();
    const verifiedSkillIds = new Set<string>();

    for (const us of userSkills) {
      userSkillBySkillId.set(us.skillId, us);
      if (us.status === 'VERIFIED') {
        verifiedSkillIds.add(us.skillId);
      }
    }

    const computedNodes: UserSkillGraphNode[] = graph.nodes.map((node) => {
      const userSkillRecord = userSkillBySkillId.get(node.skill.id);
      let userStatus: ComputedSkillState = 'locked';

      // 1. Is this skill already verified?
      if (userSkillRecord && userSkillRecord.status === 'VERIFIED') {
        userStatus = 'verified';
      } else {
        // 2. Are all prerequisites verified?
        const allPrereqsMet =
          node.prerequisiteSkillIds.length === 0 ||
          node.prerequisiteSkillIds.every((prereqId) => verifiedSkillIds.has(prereqId));

        if (allPrereqsMet) {
          if (userSkillRecord && (userSkillRecord.status === 'UNVERIFIED' || userSkillRecord.attemptCount > 0)) {
            userStatus = 'in_progress';
          } else {
            userStatus = 'available';
          }
        } else {
          userStatus = 'locked';
        }
      }

      return {
        skill: node.skill,
        prerequisiteSkillIds: node.prerequisiteSkillIds,
        dependentSkillIds: node.dependentSkillIds,
        userStatus,
        userSkillRecord,
      };
    });

    const totalSkills = computedNodes.length;
    const verifiedSkills = computedNodes.filter((n) => n.userStatus === 'verified').length;
    const availableSkills = computedNodes.filter((n) => n.userStatus === 'available').length;
    const inProgressSkills = computedNodes.filter((n) => n.userStatus === 'in_progress').length;
    const lockedSkills = computedNodes.filter((n) => n.userStatus === 'locked').length;
    const progressPercentage = totalSkills > 0 ? Math.round((verifiedSkills / totalSkills) * 100) : 0;

    return {
      domain: graph.domain,
      roadmap: graph.roadmap,
      nodes: computedNodes,
      summary: {
        totalSkills,
        verifiedSkills,
        availableSkills,
        lockedSkills,
        inProgressSkills,
        progressPercentage,
      },
    };
  }

  /**
   * Check if a skill is unlocked for assessment/learning
   */
  public async isSkillUnlocked(userId: string, skillId: string, domainSlug: string): Promise<boolean> {
    const roadmapState = await this.getUserRoadmapState(userId, domainSlug);
    if (!roadmapState) return false;

    const node = roadmapState.nodes.find((n) => n.skill.id === skillId);
    if (!node) return false;

    return node.userStatus === 'available' || node.userStatus === 'in_progress' || node.userStatus === 'verified';
  }

  /**
   * User declares/claims a skill (Invariant: NEVER verified automatically)
   */
  public async claimSkill(userId: string, skillId: string): Promise<UserSkillDTO> {
    let existing = await this.getUserSkill(userId, skillId);

    if (existing) {
      // If already verified, do not downgrade
      if (existing.status === 'VERIFIED') {
        return existing;
      }
      return existing;
    }

    const now = new Date().toISOString();
    const newRecord: UserSkillDTO = {
      id: randomUUID(),
      userId,
      skillId,
      status: 'CLAIMED',
      verificationScore: null,
      verificationDate: null,
      attemptCount: 0,
      lastAttemptAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.userSkillsMap.set(`${userId}:${skillId}`, newRecord);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        await supabase.from('user_skills').upsert({
          id: newRecord.id,
          user_id: newRecord.userId,
          skill_id: newRecord.skillId,
          status: 'CLAIMED',
          created_at: newRecord.createdAt,
          updated_at: newRecord.updatedAt,
        });
      } catch (err) {
        console.warn('[SkillService] Supabase claim sync deferred:', err);
      }
    }

    return newRecord;
  }

  /**
   * Deterministic verification update (Score >= 80 -> VERIFIED, else UNVERIFIED)
   * Protected backend invariant.
   */
  public async recordVerificationResult(
    userId: string,
    skillId: string,
    score: number
  ): Promise<UserSkillDTO> {
    const existing = (await this.getUserSkill(userId, skillId)) || {
      id: randomUUID(),
      userId,
      skillId,
      status: 'UNVERIFIED' as UserSkillStatus,
      verificationScore: null,
      verificationDate: null,
      attemptCount: 0,
      lastAttemptAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const isPassed = score >= 80.0;
    const now = new Date().toISOString();

    const updated: UserSkillDTO = {
      ...existing,
      status: isPassed ? 'VERIFIED' : 'UNVERIFIED',
      verificationScore: isPassed ? score : existing.verificationScore,
      verificationDate: isPassed ? now : existing.verificationDate,
      attemptCount: existing.attemptCount + 1,
      lastAttemptAt: now,
      updatedAt: now,
    };

    this.userSkillsMap.set(`${userId}:${skillId}`, updated);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        await supabase.from('user_skills').upsert({
          id: updated.id,
          user_id: updated.userId,
          skill_id: updated.skillId,
          status: updated.status,
          verification_score: updated.verificationScore,
          verification_date: updated.verificationDate,
          attempt_count: updated.attemptCount,
          last_attempt_at: updated.lastAttemptAt,
          updated_at: updated.updatedAt,
        });
      } catch (err) {
        console.warn('[SkillService] Supabase verification sync deferred:', err);
      }
    }

    return updated;
  }

  /**
   * Calculate newly unlocked downstream skills resulting from verifying a prerequisite skill
   */
  public async getNewlyUnlockedSkills(
    userId: string,
    justVerifiedSkillId: string
  ): Promise<Array<{ id: string; name: string; category: string }>> {
    const allUserSkills = await this.getUserSkills(userId);
    const verifiedSkillIds = new Set<string>(
      allUserSkills.filter((s) => s.status === 'VERIFIED').map((s) => s.skillId)
    );
    verifiedSkillIds.add(justVerifiedSkillId);

    const allDeps = roadmapService.getDependencies();
    const directDependentSkillIds = Array.from(
      new Set(allDeps.filter((d) => d.prerequisiteSkillId === justVerifiedSkillId).map((d) => d.skillId))
    );

    const newlyUnlocked: Array<{ id: string; name: string; category: string }> = [];

    for (const depSkillId of directDependentSkillIds) {
      if (verifiedSkillIds.has(depSkillId)) continue;

      const prereqsForDep = allDeps
        .filter((d) => d.skillId === depSkillId)
        .map((d) => d.prerequisiteSkillId);

      const allSatisfied = prereqsForDep.every((pId) => verifiedSkillIds.has(pId));

      if (allSatisfied) {
        const skillMeta = roadmapService.getSkillById(depSkillId);
        newlyUnlocked.push({
          id: depSkillId,
          name: skillMeta ? skillMeta.name : depSkillId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          category: skillMeta ? skillMeta.category : 'core',
        });
      }
    }

    return newlyUnlocked;
  }

  private mapDbRowToUserSkill(row: any): UserSkillDTO {
    return {
      id: row.id,
      userId: row.user_id,
      skillId: row.skill_id,
      status: row.status as UserSkillStatus,
      verificationScore: row.verification_score ? Number(row.verification_score) : null,
      verificationDate: row.verification_date || null,
      attemptCount: row.attempt_count || 0,
      lastAttemptAt: row.last_attempt_at || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const skillService = new SkillService();

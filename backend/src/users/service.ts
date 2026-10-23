import { UserProfileDTO, UpdateProfileInput } from './types.js';
import { isSupabaseConfigured, getSupabaseClient } from '../common/supabase.js';

export class UserService {
  private profilesMap = new Map<string, UserProfileDTO>();
  private usernameMap = new Map<string, string>(); // username -> userId

  public getOrCreateProfile(userId: string, email: string): UserProfileDTO {
    let profile = this.profilesMap.get(userId);
    if (!profile) {
      const username = (email.split('@')[0] || 'learner').toLowerCase().replace(/[^a-z0-9_]/g, '');
      profile = {
        id: userId,
        email: email,
        displayName: email.split('@')[0] || 'Learner',
        role: 'STUDENT',
        institution: 'Computer Science Department',
        collegeId: null,
        affiliationStatus: 'UNCLAIMED',
        requestedCollegeName: undefined,
        officialCollegeEmail: undefined,
        careerGoal: 'Full-Stack Software Engineer',
        githubUrl: '',
        linkedinUrl: '',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.profilesMap.set(userId, profile);
      this.usernameMap.set(username, userId);
    }
    return profile;
  }

  public async getProfileByUserId(userId: string, token?: string): Promise<UserProfileDTO | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient(token);
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (!error && data) {
          const profile: UserProfileDTO = {
            id: data.id,
            email: data.email,
            displayName: data.display_name || data.full_name || data.email.split('@')[0],
            role: data.role || 'STUDENT',
            institution: data.institution || '',
            collegeId: data.college_id || null,
            affiliationStatus: data.affiliation_status || 'UNCLAIMED',
            requestedCollegeName: data.requested_college_name || undefined,
            officialCollegeEmail: data.official_college_email || undefined,
            careerGoal: data.career_goal || '',
            githubUrl: data.github_url || '',
            linkedinUrl: data.linkedin_url || '',
            isActive: data.is_active !== undefined ? Boolean(data.is_active) : true,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          this.profilesMap.set(userId, profile);
          return profile;
        }
      } catch (err) {
        console.warn('[UserService] Supabase fetch deferred:', err);
      }
    }

    return this.profilesMap.get(userId) || null;
  }

  public async getProfileByUsername(username: string): Promise<UserProfileDTO | null> {
    const cleanUsername = username.trim().toLowerCase();
    const userId = this.usernameMap.get(cleanUsername);
    if (userId) {
      return this.getProfileByUserId(userId);
    }

    // Try finding by email prefix or display name slug
    for (const profile of this.profilesMap.values()) {
      const pUsername = (profile.email.split('@')[0] || '').toLowerCase();
      const pDisplaySlug = profile.displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (pUsername === cleanUsername || pDisplaySlug === cleanUsername) {
        return profile;
      }
    }

    return null;
  }

  public async updateProfile(userId: string, email: string, updates: UpdateProfileInput, token?: string): Promise<UserProfileDTO> {
    const current = this.getOrCreateProfile(userId, email);
    const updated: UserProfileDTO = {
      ...current,
      ...(updates.displayName && { displayName: updates.displayName }),
      ...(updates.institution !== undefined && { institution: updates.institution }),
      ...(updates.collegeId !== undefined && { collegeId: updates.collegeId }),
      ...(updates.requestedCollegeName !== undefined && { requestedCollegeName: updates.requestedCollegeName }),
      ...(updates.officialCollegeEmail !== undefined && { officialCollegeEmail: updates.officialCollegeEmail }),
      ...(updates.careerGoal !== undefined && { careerGoal: updates.careerGoal }),
      ...(updates.githubUrl !== undefined && { githubUrl: updates.githubUrl }),
      ...(updates.linkedinUrl !== undefined && { linkedinUrl: updates.linkedinUrl }),
      updatedAt: new Date().toISOString(),
    };

    this.profilesMap.set(userId, updated);
    const username = (updated.displayName || updated.email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '');
    this.usernameMap.set(username, userId);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient(token);
        await supabase.from('profiles').upsert({
          id: updated.id,
          email: updated.email,
          display_name: updated.displayName,
          full_name: updated.displayName,
          institution: updated.institution,
          college_id: updated.collegeId,
          requested_college_name: updated.requestedCollegeName,
          official_college_email: updated.officialCollegeEmail,
          career_goal: updated.careerGoal,
          github_url: updated.githubUrl,
          linkedin_url: updated.linkedinUrl,
          updated_at: updated.updatedAt,
        });
      } catch (err) {
        console.warn('[UserService] Supabase sync deferred:', err);
      }
    }

    return updated;
  }

  public async setRoleAndAffiliation(
    userId: string,
    role: UserProfileDTO['role'],
    collegeId?: string | null,
    affiliationStatus?: UserProfileDTO['affiliationStatus'],
    isActive?: boolean
  ): Promise<UserProfileDTO | null> {
    let profile: UserProfileDTO | null | undefined = this.profilesMap.get(userId);
    if (!profile) {
      profile = await this.getProfileByUserId(userId);
    }
    if (!profile) {
      profile = this.getOrCreateProfile(userId, `${userId}@hiresense.ai`);
    }

    profile.role = role;
    if (collegeId !== undefined) profile.collegeId = collegeId;
    if (affiliationStatus !== undefined) profile.affiliationStatus = affiliationStatus;
    if (isActive !== undefined) profile.isActive = isActive;
    profile.updatedAt = new Date().toISOString();

    this.profilesMap.set(userId, profile);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        await supabase.from('profiles').update({
          role: profile.role,
          college_id: profile.collegeId,
          affiliation_status: profile.affiliationStatus,
          is_active: profile.isActive,
          updated_at: profile.updatedAt,
        }).eq('id', userId);
      } catch (err) {
        console.warn('[UserService] Supabase setRole update deferred:', err);
      }
    }

    return profile;
  }

  public getAllProfiles(): UserProfileDTO[] {
    return Array.from(this.profilesMap.values());
  }
}

export const userService = new UserService();

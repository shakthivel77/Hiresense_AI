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
        role: 'student',
        institution: 'Computer Science Department',
        careerGoal: 'Full-Stack Software Engineer',
        githubUrl: '',
        linkedinUrl: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.profilesMap.set(userId, profile);
      this.usernameMap.set(username, userId);
    }
    return profile;
  }

  public async getProfileByUserId(userId: string): Promise<UserProfileDTO | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (!error && data) {
          return {
            id: data.id,
            email: data.email,
            displayName: data.full_name || data.email.split('@')[0],
            role: data.role || 'student',
            institution: data.institution || '',
            careerGoal: data.career_goal || '',
            githubUrl: data.github_url || '',
            linkedinUrl: data.linkedin_url || '',
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
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

  public async updateProfile(userId: string, email: string, updates: UpdateProfileInput): Promise<UserProfileDTO> {
    const current = this.getOrCreateProfile(userId, email);
    const updated: UserProfileDTO = {
      ...current,
      ...(updates.displayName && { displayName: updates.displayName }),
      ...(updates.institution !== undefined && { institution: updates.institution }),
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
        const supabase = getSupabaseClient();
        await supabase.from('profiles').upsert({
          id: updated.id,
          full_name: updated.displayName,
          institution: updated.institution,
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
}

export const userService = new UserService();

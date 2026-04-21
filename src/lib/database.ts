import supabase from './supabase';

export interface UserProfile {
  id: string;
  user_id: string;
  skills: string[];
  resume_text: string;
  created_at: string;
  updated_at: string;
}

export interface Progress {
  id: string;
  user_id: string;
  completed_skills: string[];
  created_at: string;
  updated_at: string;
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const upsertUserProfile = async (profile: {
  user_id: string;
  skills?: string[];
  resume_text?: string;
}): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const getUserProgress = async (userId: string): Promise<Progress | null> => {
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const upsertUserProgress = async (progress: {
  user_id: string;
  completed_skills: string[];
}): Promise<Progress> => {
  const { data, error } = await supabase
    .from('progress')
    .upsert(progress, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export function mergeUniqueSkills(...skillGroups: string[][]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const group of skillGroups) {
    for (const skill of group) {
      const normalized = skill.trim().toLowerCase();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      merged.push(skill.trim());
    }
  }

  return merged;
}

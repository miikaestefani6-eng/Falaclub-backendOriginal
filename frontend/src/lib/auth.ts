import { redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export const USER_ROLES = ["student", "teacher", "school_admin", "super_admin", "influencer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

type Profile = {
  id: string;
  full_name: string | null;
  role: UserRole | null;
  school_id: string | null;
  class_id: string | null;
  target_language: string | null;
  level: string | null;
  goal: string | null;
  daily_minutes: number | null;
  streak_count: number | null;
};

const ROLE_HOME: Record<UserRole, "/hoje" | "/professor" | "/escola" | "/master" | "/creator"> = {
  student: "/hoje",
  teacher: "/professor",
  school_admin: "/escola",
  super_admin: "/master",
  influencer: "/creator",
};

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("id,full_name,role,school_id,class_id,target_language,level,goal,daily_minutes,streak_count").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const profile = await getCurrentProfile();
  if (!profile) throw redirect({ to: "/login" });
  if (!profile.role || !allowedRoles.includes(profile.role)) throw redirect({ to: profile.role ? ROLE_HOME[profile.role] : "/login" });
  return profile;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

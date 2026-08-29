import { supabase } from "@/lib/supabase";

export interface StudentProfileContext {
  id: string;
  full_name: string | null;
  target_language: string | null;
  level: string | null;
  goal: string | null;
  daily_minutes: number | null;
  interests: string[] | null;
}

export async function getStudentProfile(): Promise<StudentProfileContext | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("id, full_name, target_language, level, goal, daily_minutes, interests").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return data as StudentProfileContext | null;
}

export function normalizeLanguage(language: string | null | undefined) {
  if (!language) return null;
  const value = language.trim().toLowerCase();
  const aliases: Record<string, string> = {
    ingles: "Inglês", inglês: "Inglês", english: "Inglês",
    espanhol: "Espanhol", spanish: "Espanhol",
    frances: "Francês", francês: "Francês", french: "Francês",
    italiano: "Italiano", italian: "Italiano",
    alemao: "Alemão", alemão: "Alemão", german: "Alemão",
  };
  return aliases[value] ?? language;
}

export function normalizeLevel(level: string | null | undefined) {
  if (!level) return null;
  const value = level.trim().toUpperCase();
  return ["A1", "A2", "B1", "B2", "C1", "C2"].includes(value) ? value : level;
}

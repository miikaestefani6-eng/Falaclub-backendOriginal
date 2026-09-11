import { supabase } from "@/lib/supabase";

export async function registerDailyLearningActivity(skill: string, minutes: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: existing, error: lookupError } = await supabase
    .from("learning_activities")
    .select("skill")
    .eq("user_id", user.id)
    .eq("skill", skill)
    .gte("completed_at", startOfDay.toISOString())
    .limit(1);

  if (lookupError) throw lookupError;
  if ((existing ?? []).length > 0) return false;

  const { error } = await supabase.from("learning_activities").insert({
    user_id: user.id,
    skill,
    minutes,
    xp_earned: 0,
    completed_at: new Date().toISOString(),
  });

  if (error) throw error;
  return true;
}

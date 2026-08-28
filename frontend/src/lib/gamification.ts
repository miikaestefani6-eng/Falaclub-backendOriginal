import { supabase } from "@/lib/supabase";

export async function concederXP(pontos: number) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.rpc("adicionar_xp", { user_id: user.id, xp_ganho: pontos });
    if (error) console.error("Erro ao creditar XP via RPC:", error);
  } catch (err) {
    console.error("Erro na gamificação:", err);
  }
}

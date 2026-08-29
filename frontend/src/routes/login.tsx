import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, LogIn, UserPlus } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErro(null); setAviso(null);
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        if (!data.user) throw new Error("Não foi possível criar sua conta.");
        if (data.session) await navigate({ to: "/hoje" });
        else { setAviso("Conta criada! Verifique seu e-mail e depois faça login para continuar."); setIsRegister(false); }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        if (!data.user) throw new Error("Não foi possível entrar na sua conta.");
        const { data: profile } = await supabase.from("profiles").select("full_name,target_language,goal,level").eq("id", data.user.id).maybeSingle();
        if (!profile?.full_name || !profile?.target_language || !profile?.goal || !profile?.level) await navigate({ to: "/onboarding" });
        else await navigate({ to: "/hoje" });
      }
    } catch (err) { setErro(err instanceof Error ? err.message : "Ocorreu um erro. Tente novamente."); }
    finally { setLoading(false); }
  }

  return <div className="grid min-h-screen place-items-center bg-background px-4"><div className="surface-card w-full max-w-md p-6"><h1 className="font-display text-2xl font-bold">{isRegister ? "Comece sua jornada com a Mia" : "Bem-vindo de volta!"}</h1><p className="mt-2 text-sm text-muted-foreground">{isRegister ? "Crie sua conta e depois personalize sua jornada." : "Continue sua jornada do ponto onde parou."}</p>{aviso && <div className="mt-4 rounded-lg bg-primary/10 p-3 text-xs text-primary">{aviso}</div>}{erro && <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-xs text-red-500">{erro}</div>}<form onSubmit={handleAuth} className="mt-6 space-y-4"><label className="block text-xs font-semibold">E-mail<input className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label><label className="block text-xs font-semibold">Senha<input className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></label><button disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-brand font-semibold text-white">{loading ? <Loader2 className="size-4 animate-spin" /> : isRegister ? <><UserPlus className="size-4" /> Cadastrar</> : <><LogIn className="size-4" /> Entrar</>}</button></form><button type="button" onClick={() => { setIsRegister(!isRegister); setErro(null); setAviso(null); }} className="mt-6 w-full text-xs font-medium text-primary">{isRegister ? "Já tenho uma conta" : "Ainda não tenho conta"}</button></div></div>;
}

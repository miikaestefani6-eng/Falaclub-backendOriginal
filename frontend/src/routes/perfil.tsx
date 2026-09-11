import { createFileRoute } from "@tanstack/react-router";
import { Check, Loader2, LogOut, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, SectionCard } from "@/components/app-shell";
import { getCurrentProfile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/perfil")({ beforeLoad: async () => ({ profile: await getCurrentProfile() }), component: Perfil });

const idiomas = ["Inglês", "Francês", "Espanhol", "Italiano", "Alemão"];
const niveis = ["A1", "A2", "B1", "B2", "C1", "C2"];
const tempos = [15, 20, 30, 45, 60];

function Perfil() {
  const { profile } = Route.useRouteContext() as { profile: Awaited<ReturnType<typeof getCurrentProfile>> };
  const [nome, setNome] = useState(profile?.full_name ?? "");
  const [idioma, setIdioma] = useState(profile?.target_language ?? "Inglês");
  const [nivel, setNivel] = useState(profile?.level ?? "A1");
  const [objetivo, setObjetivo] = useState(profile?.goal ?? "");
  const [minutos, setMinutos] = useState(profile?.daily_minutes ?? 30);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    if (!profile?.id || salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: nome.trim(), target_language: idioma, level: nivel,
        goal: objetivo.trim(), daily_minutes: minutos,
      }).eq("id", profile.id);
      if (error) throw error;
      toast.success("Preferências atualizadas.");
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      setErro("Não foi possível salvar suas preferências agora. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return <AppShell titulo="Perfil" subtitulo="Suas informações e preferências">
    {erro && <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">{erro}</div>}
    <div className="grid gap-5 md:grid-cols-2">
      <SectionCard className="overflow-hidden bg-gradient-to-br from-card via-card to-primary/5" titulo="Minha conta"><div className="flex items-center gap-4"><div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-glow"><UserRound /></div><div><p className="font-display text-lg font-bold">{nome || "Seu nome"}</p><p className="text-sm text-muted-foreground">{idioma} · {nivel}</p></div></div></SectionCard>
      <SectionCard titulo="Preferências de estudo" descricao="Essas escolhas atualizam seu plano diário">
        <form onSubmit={salvar} className="space-y-3">
          <label className="block text-xs font-semibold">Seu nome<input required value={nome} onChange={(event) => setNome(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold">Idioma<select value={idioma} onChange={(event) => setIdioma(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">{idiomas.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="block text-xs font-semibold">Nível<select value={nivel} onChange={(event) => setNivel(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">{niveis.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <label className="block text-xs font-semibold">Objetivo<input required value={objetivo} onChange={(event) => setObjetivo(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></label>
          <label className="block text-xs font-semibold">Tempo por dia<select value={minutos} onChange={(event) => setMinutos(Number(event.target.value))} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">{tempos.map((item) => <option key={item} value={item}>{item} minutos</option>)}</select></label>
          <button disabled={salvando || !nome.trim() || !objetivo.trim()} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">{salvando ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Salvar preferências</button>
        </form>
      </SectionCard>
      <SectionCard titulo="Minha jornada"><div className="flex items-center gap-3 rounded-2xl bg-gradient-mia p-4 text-sm text-primary-foreground"><Sparkles className="size-5" /><span>Continue sua rotina e deixe a Mia adaptar seus estudos ao seu momento.</span></div></SectionCard>
      <SectionCard titulo="Sessão"><div className="flex items-center gap-3 text-sm text-muted-foreground"><LogOut className="size-5" /> A saída da conta continua disponível pelo menu principal.</div></SectionCard>
    </div>
  </AppShell>;
}

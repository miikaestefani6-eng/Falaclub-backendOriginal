import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Check, Flame, Layers3, MessageCircle, Play, Sparkles, Trophy, Zap, Loader2 } from "lucide-react";
import { AppShell, SectionCard } from "@/components/app-shell";
import { MiaAvatar } from "@/components/brand";
import { aluno as alunoMock, drops, planoDoDia, recomendacoesMia } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/hoje")({
  head: () => ({ meta: [{ title: "Hoje — FalaClub" }, { name: "description", content: "Seu plano do dia montado pela Mia: XP, sequência, atividades, flashcards e Drops." }] }),
  component: Hoje,
});

const idiomaInfo: Record<string, { nome: string; bandeira: string }> = {
  Francês: { nome: "Francês", bandeira: "🇫🇷" }, Inglês: { nome: "Inglês", bandeira: "🇺🇸" }, Espanhol: { nome: "Espanhol", bandeira: "🇪🇸" }, Italiano: { nome: "Italiano", bandeira: "🇮🇹" }, Alemão: { nome: "Alemão", bandeira: "🇩🇪" },
};

function Hoje() {
  const navigate = useNavigate();
  const [alunoData, setAlunoData] = useState({ nome: "", idioma: "", bandeira: "🌎", nivel: "", nivelNumero: alunoMock.nivelNumero, objetivo: "", streak: alunoMock.streak, xp: alunoMock.xp, xpProximoNivel: alunoMock.xpProximoNivel, minutosHoje: alunoMock.minutosHoje, metaMinutos: alunoMock.metaMinutos });
  const [revisoes, setRevisoes] = useState(0), [palavras, setPalavras] = useState(0), [conversas, setConversas] = useState(0), [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarPerfil() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/login" }); return; }
      const [profileResult, flashcardsResult, vocabularyResult, conversationsResult] = await Promise.all([
        supabase.from("profiles").select("full_name,target_language,level,goal,daily_minutes,streak_count").eq("id", user.id).maybeSingle(),
        supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("vocabulary_notebook").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("channel", "app"),
      ]);
      const { data: profile, error } = profileResult;
      if (error) console.error("Erro ao carregar perfil:", error);
      if (!profile?.full_name || !profile?.target_language || !profile?.level) { navigate({ to: "/onboarding" }); return; }
      const idioma = idiomaInfo[profile.target_language] || { nome: profile.target_language, bandeira: "🌎" };
      const nivel = profile.level.match(/A1|A2|B1|B2|C1|C2/)?.[0] || profile.level;
      setAlunoData(prev => ({ ...prev, nome: profile.full_name, idioma: idioma.nome, bandeira: idioma.bandeira, nivel, nivelNumero: Number(nivel.replace("A", "").replace("B", "").replace("C", "")) || prev.nivelNumero, objetivo: profile.goal || "", streak: profile.streak_count ?? prev.streak, metaMinutos: profile.daily_minutes ?? prev.metaMinutos }));
      setRevisoes(flashcardsResult.count ?? 0); setPalavras(vocabularyResult.count ?? 0); setConversas(conversationsResult.count ?? 0); setLoading(false);
    }
    carregarPerfil().catch(err => { console.error("Erro ao carregar perfil:", err); setLoading(false); });
  }, [navigate]);

  const dropDoDia = drops[0];
  const progressoXp = Math.min(100, Math.round((alunoData.xp / Math.max(1, alunoData.xpProximoNivel)) * 100));
  return <AppShell titulo={loading ? "Carregando..." : `Fala, ${alunoData.nome}!`} subtitulo={`${alunoData.idioma} ${alunoData.bandeira} · nível ${alunoData.nivel}`}>
    <div className="grid gap-5 lg:grid-cols-3"><div className="space-y-5 lg:col-span-2">
      <section className="surface-card overflow-hidden p-0"><div className="bg-gradient-mia p-5 text-primary-foreground"><div className="flex items-center gap-3"><MiaAvatar className="size-12 ring-0" /><div><p className="text-sm font-semibold">Recado da Mia</p><p className="text-sm opacity-90">{recomendacoesMia[0]}</p></div></div><Link to="/mia" className="mt-4 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-primary"><MessageCircle className="size-4" /> Conversar com a Mia</Link></div><div className="grid grid-cols-3 divide-x divide-border"><div className="p-4 text-center"><p className="flex items-center justify-center gap-1 font-display text-xl font-bold"><Flame className="size-4 text-accent" />{loading ? <Loader2 className="size-4 animate-spin" /> : alunoData.streak}</p><p className="text-xs text-muted-foreground">dias seguidos</p></div><div className="p-4 text-center"><p className="flex items-center justify-center gap-1 font-display text-xl font-bold"><Zap className="size-4 text-primary" />{loading ? <Loader2 className="size-4 animate-spin" /> : alunoData.xp}</p><p className="text-xs text-muted-foreground">XP · nível {alunoData.nivelNumero}</p></div><div className="p-4 text-center"><p className="font-display text-xl font-bold">{alunoData.minutosHoje}/{alunoData.metaMinutos}</p><p className="text-xs text-muted-foreground">minutos hoje</p></div></div></section>
      <SectionCard titulo="Prática recomendada" descricao="O próximo passo da Mia para hoje"><div className="flex items-center justify-between gap-4 rounded-2xl bg-secondary p-4"><div><p className="text-sm font-semibold">Conversa guiada com a Mia</p><p className="mt-1 text-xs text-muted-foreground">Treine {alunoData.idioma} por {alunoData.metaMinutos} minutos sobre um tema do seu interesse.</p></div><Link to="/mia" className="shrink-0 rounded-full bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground">Começar</Link></div></SectionCard>
      <SectionCard titulo="Plano do dia" descricao={alunoData.objetivo ? `Montado pela Mia para: ${alunoData.objetivo}` : "Montado pela Mia para o seu objetivo"}><ul className="space-y-3">{planoDoDia.map(item => <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-border p-3"><span className={item.feito ? "flex size-8 items-center justify-center rounded-full bg-success/15 text-success" : "flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground"}>{item.feito ? <Check className="size-4" /> : <Play className="size-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.titulo}</p><p className="text-xs text-muted-foreground">{item.tipo} · {item.min} min</p></div></li>)}</ul></SectionCard>
    </div><div className="space-y-5"><SectionCard titulo="Seu progresso"><p className="text-sm text-muted-foreground">{alunoData.xp} de {alunoData.xpProximoNivel} XP para o próximo nível</p><div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-brand transition-all" style={{ width: `${progressoXp}%` }} /></div><Link to="/progresso" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"><Trophy className="size-4" /> Ver progresso completo</Link></SectionCard><SectionCard titulo="Acesso rápido" descricao="Continue de onde parou"><div className="grid grid-cols-2 gap-2"><Link to="/biblioteca" className="rounded-2xl border border-border p-3 hover:bg-secondary"><BookOpen className="size-5 text-primary" /><p className="mt-2 text-sm font-semibold">Vocabulário</p><p className="text-xs text-muted-foreground">{palavras} palavras</p></Link><Link to="/flashcards" className="rounded-2xl border border-border p-3 hover:bg-secondary"><Layers3 className="size-5 text-primary" /><p className="mt-2 text-sm font-semibold">Flashcards</p><p className="text-xs text-muted-foreground">{revisoes} para revisar</p></Link></div><div className="mt-2 rounded-2xl border border-border p-3"><p className="text-xs text-muted-foreground">Conversas com a Mia</p><p className="font-display text-2xl font-bold">{conversas}</p></div></SectionCard>{dropDoDia ? <SectionCard titulo="Drop de hoje" descricao={dropDoDia.tema}><p className="font-display text-2xl font-bold">{dropDoDia.palavra}</p><p className="text-sm text-muted-foreground">{dropDoDia.pronuncia}</p><p className="mt-3 text-sm">{dropDoDia.curiosidade}</p><Link to="/drops" className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground"><Sparkles className="size-4" /> Ver todos os Drops</Link></SectionCard> : null}</div></div>
  </AppShell>;
}

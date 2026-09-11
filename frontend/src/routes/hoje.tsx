import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Check, Flame, Layers3, Loader2, MessageCircle, Play, Sparkles, Trophy, Zap } from "lucide-react";
import { AppShell, SectionCard } from "@/components/app-shell";
import { MiaAvatar } from "@/components/brand";
import { normalizeLanguage } from "@/lib/profile-context";
import { buildWeeklyStudyPlan, getTodayStudyPlan, type StudyPlanItem } from "@/lib/study-plan";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/hoje")({
  head: () => ({ meta: [{ title: "Hoje — FalaClub" }, { name: "description", content: "Seu plano do dia: rotina personalizada, progresso, flashcards e Drops." }] }),
  component: Hoje,
});

const idiomaInfo: Record<string, { nome: string; bandeira: string }> = {
  Francês: { nome: "Francês", bandeira: "🇫🇷" }, Inglês: { nome: "Inglês", bandeira: "🇺🇸" }, Espanhol: { nome: "Espanhol", bandeira: "🇪🇸" }, Italiano: { nome: "Italiano", bandeira: "🇮🇹" }, Alemão: { nome: "Alemão", bandeira: "🇩🇪" },
};

type AlunoDashboard = { nome: string; idioma: string; bandeira: string; nivel: string; nivelNumero: number; objetivo: string; streak: number; xp: number; xpProximoNivel: number; minutosHoje: number; metaMinutos: number };
type AtividadeHoje = { skill: string | null; minutes: number | null };
type DropDoDia = { id: string; theme: string; word: string; pronunciation: string | null; translation: string; curiosity: string | null };

const alunoInicial: AlunoDashboard = { nome: "", idioma: "", bandeira: "🌎", nivel: "", nivelNumero: 1, objetivo: "", streak: 0, xp: 0, xpProximoNivel: 100, minutosHoje: 0, metaMinutos: 15 };

function Hoje() {
  const navigate = useNavigate();
  const [alunoData, setAlunoData] = useState<AlunoDashboard>(alunoInicial);
  const [revisoes, setRevisoes] = useState(0);
  const [palavras, setPalavras] = useState(0);
  const [conversas, setConversas] = useState(0);
  const [atividadesHoje, setAtividadesHoje] = useState<AtividadeHoje[]>([]);
  const [dropDoDia, setDropDoDia] = useState<DropDoDia | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvandoAtividade, setSalvandoAtividade] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregarDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { await navigate({ to: "/login" }); return; }

      const agora = new Date();
      const inicioDoDia = new Date(agora);
      inicioDoDia.setHours(0, 0, 0, 0);
      const [profileResult, flashcardsResult, vocabularyResult, conversationsResult, activitiesResult] = await Promise.all([
        supabase.from("profiles").select("full_name,target_language,level,goal,daily_minutes,streak_count,xp_total").eq("id", user.id).maybeSingle(),
        supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user.id).lte("next_review_at", agora.toISOString()),
        supabase.from("vocabulary_notebook").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("channel", "app"),
        supabase.from("learning_activities").select("skill,minutes").eq("user_id", user.id).gte("completed_at", inicioDoDia.toISOString()),
      ]);

      if (profileResult.error) throw profileResult.error;
      const profile = profileResult.data;
      if (!profile?.full_name || !profile?.target_language || !profile?.level) { await navigate({ to: "/onboarding" }); return; }

      const idiomaNormalizado = normalizeLanguage(profile.target_language) ?? profile.target_language;
      const idioma = idiomaInfo[idiomaNormalizado] || { nome: idiomaNormalizado, bandeira: "🌎" };
      const nivel = profile.level.match(/A1|A2|B1|B2|C1|C2/)?.[0] || profile.level;
      const xp = profile.xp_total ?? 0;
      const atividades = (activitiesResult.data ?? []) as AtividadeHoje[];
      const minutosHoje = atividades.reduce((total, atividade) => total + (atividade.minutes ?? 0), 0);
      const xpProximoNivel = Math.max(100, (Math.floor(xp / 100) + 1) * 100);
      const { data: drop, error: dropError } = await supabase.from("daily_drops").select("id,theme,word,pronunciation,translation,curiosity").eq("language", idiomaNormalizado).order("created_at", { ascending: false }).limit(1).maybeSingle();

      if (!ativo) return;
      setAlunoData({ nome: profile.full_name, idioma: idioma.nome, bandeira: idioma.bandeira, nivel, nivelNumero: ["A1", "A2", "B1", "B2", "C1", "C2"].indexOf(nivel) + 1 || 1, objetivo: profile.goal || "", streak: profile.streak_count ?? 0, xp, xpProximoNivel, minutosHoje, metaMinutos: profile.daily_minutes ?? 15 });
      setRevisoes(flashcardsResult.count ?? 0);
      setPalavras(vocabularyResult.count ?? 0);
      setConversas(conversationsResult.count ?? 0);
      setAtividadesHoje(atividades);
      setDropDoDia(dropError ? null : (drop as DropDoDia | null));
      setErro(null);
    }

    carregarDashboard().catch((error) => {
      console.error("Erro ao carregar painel de hoje:", error);
      if (ativo) setErro("Não foi possível atualizar seus dados agora. Tente novamente em instantes.");
    }).finally(() => { if (ativo) setLoading(false); });

    return () => { ativo = false; };
  }, [navigate]);

  const weeklyPlan = useMemo(() => buildWeeklyStudyPlan({ level: alunoData.nivel, goal: alunoData.objetivo, dailyMinutes: alunoData.metaMinutos }), [alunoData.nivel, alunoData.objetivo, alunoData.metaMinutos]);
  const todayPlan = useMemo(() => getTodayStudyPlan(weeklyPlan), [weeklyPlan]);

  const completedSkills = useMemo(() => new Set(atividadesHoje.map((atividade) => atividade.skill?.trim().toLowerCase()).filter(Boolean)), [atividadesHoje]);
  const isPlanItemDone = (skillKey: "speaking" | "content" | "vocabulary" | "culture") => {
    if (skillKey === "speaking") return ["fala", "speaking", "speaking_practice"].some((skill) => completedSkills.has(skill));
    if (skillKey === "vocabulary") return revisoes === 0 || completedSkills.has("vocabulary");
    return completedSkills.has(skillKey);
  };

  async function concluirAtividade(item: StudyPlanItem) {
    if (isPlanItemDone(item.skillKey) || salvandoAtividade) return;
    setSalvandoAtividade(item.id);
    setErro(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");
      const { error } = await supabase.from("learning_activities").insert({
        user_id: user.id,
        skill: item.skillKey,
        minutes: item.minutes,
        xp_earned: 0,
        completed_at: new Date().toISOString(),
      });
      if (error) throw error;
      setAtividadesHoje((atuais) => [...atuais, { skill: item.skillKey, minutes: item.minutes }]);
      setAlunoData((atual) => ({ ...atual, minutosHoje: atual.minutosHoje + item.minutes }));
    } catch (error) {
      console.error("Erro ao concluir atividade do plano:", error);
      setErro("Não foi possível registrar essa atividade agora. Tente novamente.");
    } finally {
      setSalvandoAtividade(null);
    }
  }

  const nextItem = todayPlan.items.find((item) => !isPlanItemDone(item.skillKey)) ?? todayPlan.items[0];
  const recomendacaoMia = alunoData.minutosHoje >= alunoData.metaMinutos ? "Meta do dia concluída! Se quiser, podemos fazer uma conversa livre. ☕" : `Hoje o foco é ${todayPlan.focus.toLowerCase()}. Você tem ${Math.max(0, alunoData.metaMinutos - alunoData.minutosHoje)} minutos restantes na sua meta. ☕`;
  const progressoXp = Math.min(100, alunoData.xp % 100);

  return <AppShell titulo={loading ? "Carregando..." : `Fala, ${alunoData.nome}!`} subtitulo={`${alunoData.idioma} ${alunoData.bandeira} · nível ${alunoData.nivel}`}>
    {erro && <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">{erro}</div>}
    <div className="grid gap-5 lg:grid-cols-3"><div className="space-y-5 lg:col-span-2">
      <section className="surface-card overflow-hidden p-0"><div className="bg-gradient-mia p-5 text-primary-foreground"><div className="flex items-center gap-3"><MiaAvatar className="size-12 ring-0" /><div><p className="text-sm font-semibold">Recado da Mia</p><p className="text-sm opacity-90">{recomendacaoMia}</p></div></div><Link to="/mia" className="mt-4 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-primary"><MessageCircle className="size-4" /> Conversar com a Mia</Link></div><div className="grid grid-cols-3 divide-x divide-border"><div className="p-4 text-center"><p className="flex items-center justify-center gap-1 font-display text-xl font-bold"><Flame className="size-4 text-accent" />{loading ? <Loader2 className="size-4 animate-spin" /> : alunoData.streak}</p><p className="text-xs text-muted-foreground">dias seguidos</p></div><div className="p-4 text-center"><p className="flex items-center justify-center gap-1 font-display text-xl font-bold"><Zap className="size-4 text-primary" />{loading ? <Loader2 className="size-4 animate-spin" /> : alunoData.xp}</p><p className="text-xs text-muted-foreground">XP · nível {alunoData.nivelNumero}</p></div><div className="p-4 text-center"><p className="font-display text-xl font-bold">{alunoData.minutosHoje}/{alunoData.metaMinutos}</p><p className="text-xs text-muted-foreground">minutos hoje</p></div></div></section>

      <SectionCard titulo="Prática recomendada" descricao={`Hoje: ${todayPlan.focus}`}><div className="flex items-center justify-between gap-4 rounded-2xl bg-secondary p-4"><div><p className="text-sm font-semibold">{nextItem.title}</p><p className="mt-1 text-xs text-muted-foreground">{nextItem.type} · {nextItem.minutes} min · alinhado ao seu nível e objetivo.</p></div><Link to={nextItem.to} className="shrink-0 rounded-full bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground">Começar</Link></div></SectionCard>

      <SectionCard titulo="Seu plano de hoje" descricao={alunoData.objetivo ? `Baseado na sua meta: ${alunoData.objetivo}` : "Baseado no seu nível e no tempo disponível"}><ul className="space-y-3">{todayPlan.items.map(item => { const feito = isPlanItemDone(item.skillKey); const salvando = salvandoAtividade === item.id; return <li key={item.id} className="rounded-2xl border border-border p-3"><div className="flex items-center gap-3"><span className={feito ? "flex size-8 items-center justify-center rounded-full bg-success/15 text-success" : "flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground"}>{feito ? <Check className="size-4" /> : <Play className="size-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">{item.type} · {item.minutes} min</p></div><Link to={item.to} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">Abrir</Link></div><div className="mt-3 flex justify-end"><button type="button" disabled={feito || salvando} onClick={() => concluirAtividade(item)} className={feito ? "rounded-full bg-success/15 px-3 py-1.5 text-xs font-semibold text-success" : "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"}>{feito ? "Concluído" : salvando ? "Salvando..." : "Marcar como concluído"}</button></div></li>; })}</ul></SectionCard>

      <SectionCard titulo="Sua semana" descricao="Uma rotina simples para você não precisar decidir o que estudar todos os dias"><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{weeklyPlan.map(day => { const ativo = day.weekday === new Date().getDay(); return <div key={day.weekday} className={ativo ? "rounded-2xl border border-primary/40 bg-primary/5 p-3" : "rounded-2xl border border-border p-3"}><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{day.label}{ativo ? " · hoje" : ""}</p><p className="mt-1 text-sm font-semibold">{day.focus}</p><p className="mt-1 text-xs text-muted-foreground">{day.items.reduce((total, item) => total + item.minutes, 0)} min</p></div>; })}</div></SectionCard>
    </div><div className="space-y-5"><SectionCard titulo="Seu progresso"><p className="text-sm text-muted-foreground">{alunoData.xp} XP no total · próximo marco em {alunoData.xpProximoNivel} XP</p><div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-brand transition-all" style={{ width: `${progressoXp}%` }} /></div><Link to="/progresso" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"><Trophy className="size-4" /> Ver progresso completo</Link></SectionCard><SectionCard titulo="Acesso rápido" descricao="Continue de onde parou"><div className="grid grid-cols-2 gap-2"><Link to="/biblioteca" className="rounded-2xl border border-border p-3 hover:bg-secondary"><BookOpen className="size-5 text-primary" /><p className="mt-2 text-sm font-semibold">Vocabulário</p><p className="text-xs text-muted-foreground">{palavras} palavras</p></Link><Link to="/flashcards" className="rounded-2xl border border-border p-3 hover:bg-secondary"><Layers3 className="size-5 text-primary" /><p className="mt-2 text-sm font-semibold">Flashcards</p><p className="text-xs text-muted-foreground">{revisoes} para revisar</p></Link></div><div className="mt-2 rounded-2xl border border-border p-3"><p className="text-xs text-muted-foreground">Conversas com a Mia</p><p className="font-display text-2xl font-bold">{conversas}</p></div></SectionCard>{dropDoDia ? <SectionCard titulo="Drop de hoje" descricao={dropDoDia.theme}><p className="font-display text-2xl font-bold">{dropDoDia.word}</p>{dropDoDia.pronunciation && <p className="text-sm text-muted-foreground">{dropDoDia.pronunciation}</p>}<p className="mt-2 text-sm font-semibold">{dropDoDia.translation}</p>{dropDoDia.curiosity && <p className="mt-3 text-sm">{dropDoDia.curiosity}</p>}<Link to="/drops" className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground"><Sparkles className="size-4" /> Ver todos os Drops</Link></SectionCard> : <SectionCard titulo="Drops do idioma"><p className="text-sm text-muted-foreground">Ainda não há um Drop publicado para {alunoData.idioma || "seu idioma"}.</p><Link to="/drops" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="size-4" /> Conferir Drops</Link></SectionCard>}</div></div>
  </AppShell>;
}

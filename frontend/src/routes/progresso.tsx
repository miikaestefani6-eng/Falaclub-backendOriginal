import { createFileRoute } from "@tanstack/react-router";
import { Award, Flame, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, SectionCard, Stat } from "@/components/app-shell";
import { cn } from "@/lib/utils";
import { getStudentProfile, normalizeLanguage, normalizeLevel } from "@/lib/profile-context";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/progresso")({ component: Progresso });
const cefr = ["A1", "A2", "B1", "B2", "C1", "C2"];
const skillLabels = ["Fala", "Escuta", "Leitura", "Escrita", "Vocabulário", "Pronúncia"];
const skillAliases: Record<string, string> = { fala: "Fala", speaking: "Fala", speaking_practice: "Fala", escuta: "Escuta", listening: "Escuta", listening_practice: "Escuta", leitura: "Leitura", reading: "Leitura", escrita: "Escrita", writing: "Escrita", vocabulario: "Vocabulário", vocabulário: "Vocabulário", vocabulary: "Vocabulário", pronunciation: "Pronúncia", pronúncia: "Pronúncia" };

type SkillStat = { nome: string; valor: number; minutos: number };
type Activity = { skill: string | null; minutes: number | null; xp_earned: number | null; completed_at: string | null };

function Progresso() {
  const [perfil, setPerfil] = useState<any>(null);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [nivel, setNivel] = useState("A1");
  const [skills, setSkills] = useState<SkillStat[]>(skillLabels.map((nome) => ({ nome, valor: 0, minutos: 0 })));
  const [atividades, setAtividades] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: p }, { data: acts }] = await Promise.all([
        supabase.from("profiles").select("full_name, target_language, level, streak_count, xp_total").eq("id", user.id).maybeSingle(),
        supabase.from("learning_activities").select("skill, minutes, xp_earned, completed_at").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(500),
      ]);
      setPerfil(p);
      setXp(p?.xp_total ?? 0);
      setStreak(p?.streak_count ?? 0);
      setNivel(normalizeLevel(p?.level)?.match(/A1|A2|B1|B2|C1|C2/)?.[0] ?? "A1");
      const activityRows = (acts ?? []) as Activity[];
      setAtividades(activityRows.length);
      const totals = new Map<string, { minutes: number; count: number }>();
      for (const activity of activityRows) {
        const key = activity.skill ? (skillAliases[activity.skill.trim().toLowerCase()] ?? activity.skill) : null;
        if (!key) continue;
        const current = totals.get(key) ?? { minutes: 0, count: 0 };
        current.minutes += activity.minutes ?? 0;
        current.count += 1;
        totals.set(key, current);
      }
      const maxCount = Math.max(1, ...Array.from(totals.values()).map((v) => v.count));
      setSkills(skillLabels.map((nome) => { const value = totals.get(nome) ?? { minutes: 0, count: 0 }; return { nome, minutos: value.minutes, valor: Math.min(100, Math.round((value.count / maxCount) * 100)) }; }));
    })().catch(console.error);
  }, []);

  const conquistas = [
    { nome: "Primeiro passo", icone: "🌱", ganha: atividades >= 1 },
    { nome: "100 XP", icone: "⚡", ganha: xp >= 100 },
    { nome: "7 dias", icone: "🔥", ganha: streak >= 7 },
    { nome: "500 XP", icone: "🏆", ganha: xp >= 500 },
    { nome: "30 dias", icone: "🌟", ganha: streak >= 30 },
    { nome: "1.000 XP", icone: "💎", ganha: xp >= 1000 },
  ];

  return <AppShell titulo="Progresso" subtitulo="Cada dia praticado é confiança acumulada"><div className="grid gap-4 sm:grid-cols-3"><Stat rotulo="XP total" valor={`${xp}`} delta={`Nível ${nivel}`} /><Stat rotulo="Sequência" valor={`${streak} dias`} delta="Recorde pessoal" /><Stat rotulo="Nível CEFR" valor={nivel} /></div><div className="mt-5 grid gap-5 lg:grid-cols-2"><SectionCard titulo="Habilidades" descricao={`Atividades reais em ${normalizeLanguage(perfil?.target_language) || "seu idioma"}`}><ul className="space-y-4">{skills.map(h => <li key={h.nome}><div className="flex items-center justify-between text-sm"><span className="font-semibold">{h.nome}</span><span className="text-muted-foreground">{h.valor}% · {h.minutos} min</span></div><div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-brand" style={{width:`${h.valor}%`}} /></div></li>)}</ul></SectionCard><div className="space-y-5"><SectionCard titulo="Jornada CEFR"><div className="flex items-center gap-2">{cefr.map(n => <span key={n} className={cn("flex-1 rounded-xl px-2 py-3 text-center text-sm font-bold",n===nivel?"bg-gradient-brand text-primary-foreground":"bg-secondary text-secondary-foreground/70")}>{n}</span>)}</div><p className="mt-3 text-sm text-muted-foreground">Seu nível acompanha os dados do seu perfil.</p></SectionCard><SectionCard titulo="Conquistas"><ul className="grid grid-cols-3 gap-3">{conquistas.map(c => <li key={c.nome} className={cn("rounded-2xl border border-border p-3 text-center",!c.ganha&&"opacity-40")}><span className="text-2xl">{c.icone}</span><p className="mt-1 text-[11px] font-semibold leading-tight">{c.nome}</p></li>)}</ul></SectionCard><SectionCard titulo="Certificados"><div className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-4"><Award className="size-6 text-primary" /><p className="text-sm text-muted-foreground">Seus certificados aparecerão aqui conforme você concluir os níveis.</p></div><div className="mt-3 flex gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Flame className="size-3.5 text-accent" /> streak conta pontos</span><span className="inline-flex items-center gap-1"><Zap className="size-3.5 text-primary" /> continue praticando</span></div></SectionCard></div></div></AppShell>;
}

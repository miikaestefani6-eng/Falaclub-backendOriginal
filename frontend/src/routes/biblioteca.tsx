import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { filtrosBiblioteca } from "@/lib/mock-data";
import { getStudentProfile, normalizeLanguage, normalizeLevel } from "@/lib/profile-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({ meta: [{ title: "Biblioteca — FalaClub" }, { name: "description", content: "Vídeos, áudios, músicas, podcasts, PDFs, apostilas e aulas filtrados por idioma e nível." }] }),
  component: Biblioteca,
});

type Conteudo = {
  id: string;
  title: string;
  content_type: string;
  language: string;
  level: string;
  category: string;
  duration_label: string | null;
  [key: string]: unknown;
};

function pickString(item: Conteudo, keys: string[]) {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function parseMinutes(label: string | null) {
  const value = label?.match(/\d+/)?.[0];
  return value ? Math.max(1, Number(value)) : 15;
}

function Biblioteca() {
  const [idioma, setIdioma] = useState("Todos");
  const [nivel, setNivel] = useState("Todos");
  const [categoria, setCategoria] = useState("Todos");
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [selecionado, setSelecionado] = useState<Conteudo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [concluindo, setConcluindo] = useState(false);
  const [concluido, setConcluido] = useState(false);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const perfil = await getStudentProfile();
        const idiomaPerfil = normalizeLanguage(perfil?.target_language);
        const nivelPerfil = normalizeLevel(perfil?.level);
        if (idiomaPerfil && filtrosBiblioteca.idioma.includes(idiomaPerfil)) setIdioma(idiomaPerfil);
        if (nivelPerfil && filtrosBiblioteca.nivel.includes(nivelPerfil)) setNivel(nivelPerfil);
        let query = supabase.from("library_content").select("*").order("created_at", { ascending: false });
        if (idiomaPerfil) query = query.eq("language", idiomaPerfil);
        if (nivelPerfil) query = query.eq("level", nivelPerfil);
        const { data, error } = await query;
        if (error) throw error;
        if (ativo) setConteudos((data ?? []) as Conteudo[]);
      } catch (error) {
        console.error("Erro ao carregar Biblioteca:", error);
        if (ativo) setConteudos([]);
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, []);

  const itens = useMemo(() => conteudos.filter(item => (idioma === "Todos" || item.language === idioma) && (nivel === "Todos" || item.level === nivel) && (categoria === "Todos" || item.category === categoria)), [conteudos, idioma, nivel, categoria]);
  const grupos = [
    { rotulo: "Idioma", valor: idioma, set: setIdioma, opcoes: filtrosBiblioteca.idioma },
    { rotulo: "Nível", valor: nivel, set: setNivel, opcoes: filtrosBiblioteca.nivel },
    { rotulo: "Categoria", valor: categoria, set: setCategoria, opcoes: filtrosBiblioteca.categoria },
  ];

  const textoSelecionado = selecionado ? pickString(selecionado, ["body", "body_text", "content", "description", "summary", "text"]) : null;
  const urlSelecionada = selecionado ? pickString(selecionado, ["content_url", "media_url", "file_url", "external_url", "url", "source_url"]) : null;

  async function concluirConteudo() {
    if (!selecionado || concluindo) return;
    setConcluindo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const inicioDoDia = new Date();
      inicioDoDia.setHours(0, 0, 0, 0);
      const { data: existente } = await supabase.from("learning_activities").select("id").eq("user_id", user.id).eq("skill", "content").gte("completed_at", inicioDoDia.toISOString()).limit(1).maybeSingle();
      if (!existente) {
        const { error } = await supabase.from("learning_activities").insert({
          user_id: user.id,
          skill: "content",
          minutes: parseMinutes(selecionado.duration_label),
          completed_at: new Date().toISOString(),
          xp_earned: 0,
        });
        if (error) throw error;
      }
      setConcluido(true);
    } catch (error) {
      console.error("Erro ao concluir conteúdo:", error);
    } finally {
      setConcluindo(false);
    }
  }

  return <AppShell titulo="Biblioteca" subtitulo={carregando ? "Carregando seu conteúdo..." : `${itens.length} conteúdos disponíveis`}>
    <div className="space-y-4">{grupos.map(g => <div key={g.rotulo}><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.rotulo}</p><div className="flex flex-wrap gap-2">{g.opcoes.map(o => <button key={o} onClick={() => g.set(o)} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors", g.valor === o ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground")}>{o}</button>)}</div></div>)}</div>

    {carregando ? <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-primary" /></div> : <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{itens.map(item => <article key={item.id} className="surface-card p-5"><span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-secondary-foreground">{item.content_type}</span><h2 className="mt-3 font-display text-base font-bold">{item.title}</h2><p className="mt-1 text-xs text-muted-foreground">{item.language} · {item.level} · {item.category}</p>{item.duration_label ? <p className="mt-3 text-xs font-semibold text-primary">{item.duration_label}</p> : null}<button onClick={() => { setSelecionado(item); setConcluido(false); }} className="mt-4 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Abrir conteúdo</button></article>)}{itens.length === 0 ? <p className="text-sm text-muted-foreground">Ainda não há conteúdo disponível para seu idioma e nível.</p> : null}</div>}

    {selecionado && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setSelecionado(null)}><section onClick={event => event.stopPropagation()} className="surface-card max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6"><div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-secondary-foreground">{selecionado.content_type}</span><h2 className="mt-3 font-display text-xl font-bold">{selecionado.title}</h2><p className="mt-1 text-sm text-muted-foreground">{selecionado.language} · {selecionado.level} · {selecionado.category}{selecionado.duration_label ? ` · ${selecionado.duration_label}` : ""}</p></div><button onClick={() => setSelecionado(null)} className="rounded-full bg-secondary p-2" aria-label="Fechar"><X className="size-4" /></button></div>
      {textoSelecionado ? <div className="mt-6 whitespace-pre-wrap text-sm leading-6">{textoSelecionado}</div> : null}
      {urlSelecionada ? <a href={urlSelecionada} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground"><ExternalLink className="size-4" /> Abrir material</a> : null}
      {!textoSelecionado && !urlSelecionada ? <div className="mt-6 rounded-2xl bg-secondary/60 p-4 text-sm text-muted-foreground">Este conteúdo já está cadastrado na Biblioteca, mas ainda não tem material de leitura ou link publicado.</div> : null}
      <div className="mt-6 border-t border-border pt-4"><button disabled={concluindo || concluido} onClick={concluirConteudo} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{concluindo ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}{concluido ? "Estudo concluído" : "Marcar estudo como concluído"}</button><p className="mt-2 text-xs text-muted-foreground">Ao concluir, esse tempo entra no seu progresso do dia.</p></div>
    </section></div>}
  </AppShell>;
}

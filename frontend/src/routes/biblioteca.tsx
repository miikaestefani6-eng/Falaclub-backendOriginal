import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { filtrosBiblioteca } from "@/lib/mock-data";
import { getStudentProfile, normalizeLanguage, normalizeLevel } from "@/lib/profile-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({ meta: [{ title: "Biblioteca — FalaClub" }, { name: "description", content: "Vídeos, áudios, músicas, podcasts, PDFs, apostilas e aulas filtrados por idioma e nível." }] }),
  component: Biblioteca,
});

type Conteudo = { id: string; title: string; content_type: string; language: string; level: string; category: string; duration_label: string | null };

function Biblioteca() {
  const [idioma, setIdioma] = useState("Todos");
  const [nivel, setNivel] = useState("Todos");
  const [categoria, setCategoria] = useState("Todos");
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const perfil = await getStudentProfile();
        const idiomaPerfil = normalizeLanguage(perfil?.target_language);
        const nivelPerfil = normalizeLevel(perfil?.level);
        if (idiomaPerfil && filtrosBiblioteca.idioma.includes(idiomaPerfil)) setIdioma(idiomaPerfil);
        if (nivelPerfil && filtrosBiblioteca.nivel.includes(nivelPerfil)) setNivel(nivelPerfil);
        let query = supabase.from("library_content").select("id, title, content_type, language, level, category, duration_label").order("created_at", { ascending: false });
        if (idiomaPerfil) query = query.eq("language", idiomaPerfil);
        if (nivelPerfil) query = query.eq("level", nivelPerfil);
        const { data, error } = await query;
        if (error) throw error;
        if (ativo) setConteudos((data ?? []) as Conteudo[]);
      } catch (error) { console.error("Erro ao carregar Biblioteca:", error); if (ativo) setConteudos([]); }
      finally { if (ativo) setCarregando(false); }
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

  return <AppShell titulo="Biblioteca" subtitulo={carregando ? "Carregando seu conteúdo..." : `${itens.length} conteúdos disponíveis`}>
    <div className="space-y-4">{grupos.map(g => <div key={g.rotulo}><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.rotulo}</p><div className="flex flex-wrap gap-2">{g.opcoes.map(o => <button key={o} onClick={() => g.set(o)} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors", g.valor === o ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground")}>{o}</button>)}</div></div>)}</div>
    {carregando ? <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-primary" /></div> : <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{itens.map(item => <article key={item.id} className="surface-card p-5"><span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-secondary-foreground">{item.content_type}</span><h2 className="mt-3 font-display text-base font-bold">{item.title}</h2><p className="mt-1 text-xs text-muted-foreground">{item.language} · {item.level} · {item.category}</p>{item.duration_label ? <p className="mt-3 text-xs font-semibold text-primary">{item.duration_label}</p> : null}</article>)}{itens.length === 0 ? <p className="text-sm text-muted-foreground">Ainda não há conteúdo disponível para seu idioma e nível.</p> : null}</div>}
  </AppShell>;
}

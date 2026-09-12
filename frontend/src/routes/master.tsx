import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Loader2, RefreshCw, Trash2, Users } from "lucide-react";
import { AppShell, SectionCard, Stat } from "@/components/app-shell";
import { requireRole, type UserRole } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/master")({
  beforeLoad: async () => ({ profile: await requireRole(["super_admin"]) }),
  component: Master,
});

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: UserRole | null;
  target_language: string | null;
  level: string | null;
  goal: string | null;
};

type LibraryRow = {
  id: string;
  title: string;
  content_type: string;
  language: string;
  level: string;
  category: string;
  duration_label: string | null;
  created_at?: string | null;
};

const emptyContent = {
  title: "",
  content_type: "Aula",
  language: "Inglês",
  level: "A1",
  category: "Vocabulário",
  duration_label: "15 min",
};

function Master() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [contents, setContents] = useState<LibraryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState(emptyContent);

  async function loadDashboard() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [{ data: profileData, error: profileError }, { data: contentData, error: contentError }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, role, target_language, level, goal").order("full_name", { ascending: true }),
        supabase.from("library_content").select("id, title, content_type, language, level, category, duration_label, created_at").order("created_at", { ascending: false }),
      ]);

      if (profileError) throw profileError;
      if (contentError) throw contentError;
      setProfiles((profileData ?? []) as ProfileRow[]);
      setContents((contentData ?? []) as LibraryRow[]);
    } catch (error) {
      console.error("Erro ao carregar CMS Master:", error);
      setErrorMessage("Não foi possível carregar os dados administrativos agora.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const students = useMemo(() => profiles.filter((profile) => profile.role === "student"), [profiles]);
  const teachers = useMemo(() => profiles.filter((profile) => profile.role === "teacher"), [profiles]);
  const admins = useMemo(() => profiles.filter((profile) => profile.role === "super_admin" || profile.role === "school_admin"), [profiles]);

  async function createContent(event: React.FormEvent) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) return;

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { data, error } = await supabase
        .from("library_content")
        .insert({
          title,
          content_type: form.content_type,
          language: form.language,
          level: form.level,
          category: form.category,
          duration_label: form.duration_label.trim() || null,
        })
        .select("id, title, content_type, language, level, category, duration_label, created_at")
        .single();

      if (error) throw error;
      if (data) setContents((current) => [data as LibraryRow, ...current]);
      setForm(emptyContent);
      setSuccessMessage("Conteúdo cadastrado na Biblioteca.");
    } catch (error) {
      console.error("Erro ao cadastrar conteúdo:", error);
      setErrorMessage("Não foi possível cadastrar o conteúdo. Confira as permissões do CMS.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteContent(content: LibraryRow) {
    const confirmed = window.confirm(`Excluir “${content.title}” da Biblioteca?`);
    if (!confirmed) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { error } = await supabase.from("library_content").delete().eq("id", content.id);
      if (error) throw error;
      setContents((current) => current.filter((item) => item.id !== content.id));
      setSuccessMessage("Conteúdo removido da Biblioteca.");
    } catch (error) {
      console.error("Erro ao excluir conteúdo:", error);
      setErrorMessage("Não foi possível excluir o conteúdo. Confira as permissões do CMS.");
    }
  }

  return (
    <AppShell titulo="CMS Master" subtitulo="Administração essencial do FalaClub Beta">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-gradient-brand p-6 text-primary-foreground shadow-glow">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-80">Beta V1</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">Painel administrativo</h2>
            <p className="mt-2 max-w-xl text-sm opacity-85">Acompanhe os primeiros usuários e mantenha a Biblioteca sem precisar editar o banco manualmente.</p>
          </div>
          <button type="button" onClick={() => void loadDashboard()} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Atualizar
          </button>
        </div>

        {errorMessage && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">{errorMessage}</div>}
        {successMessage && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat rotulo="Usuários" valor={loading ? "—" : profiles.length.toString()} />
          <Stat rotulo="Alunos" valor={loading ? "—" : students.length.toString()} />
          <Stat rotulo="Professores" valor={loading ? "—" : teachers.length.toString()} />
          <Stat rotulo="Conteúdos" valor={loading ? "—" : contents.length.toString()} />
        </div>

        <SectionCard titulo="Usuários do Beta" descricao={`${students.length} alunos · ${admins.length} administradores`}>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-primary" /></div>
          ) : profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="pb-3">Nome</th><th className="pb-3">Perfil</th><th className="pb-3">Idioma</th><th className="pb-3">Nível</th><th className="pb-3">Objetivo</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {profiles.map((profile) => (
                    <tr key={profile.id}>
                      <td className="py-3 font-semibold">{profile.full_name || "Sem nome"}</td>
                      <td className="py-3">{profile.role || "sem perfil"}</td>
                      <td className="py-3">{profile.target_language || "—"}</td>
                      <td className="py-3">{profile.level || "—"}</td>
                      <td className="max-w-xs py-3 text-muted-foreground">{profile.goal || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <SectionCard titulo="Adicionar à Biblioteca" descricao="Cadastro essencial de conteúdo para o Beta">
            <form onSubmit={createContent} className="space-y-4">
              <label className="block text-sm font-semibold">Título<input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3" /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold">Tipo<input value={form.content_type} onChange={(event) => setForm((current) => ({ ...current, content_type: event.target.value }))} className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3" /></label>
                <label className="block text-sm font-semibold">Categoria<input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3" /></label>
                <label className="block text-sm font-semibold">Idioma<select value={form.language} onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))} className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3"><option>Inglês</option><option>Francês</option><option>Espanhol</option><option>Italiano</option><option>Alemão</option></select></label>
                <label className="block text-sm font-semibold">Nível<select value={form.level} onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))} className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3"><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select></label>
              </div>
              <label className="block text-sm font-semibold">Duração<input value={form.duration_label} onChange={(event) => setForm((current) => ({ ...current, duration_label: event.target.value }))} placeholder="Ex.: 15 min" className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3" /></label>
              <button disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-60">{saving ? <Loader2 className="size-4 animate-spin" /> : <BookOpen className="size-4" />}{saving ? "Salvando..." : "Cadastrar conteúdo"}</button>
            </form>
          </SectionCard>

          <SectionCard titulo="Conteúdos publicados" descricao={`${contents.length} itens cadastrados`}>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-primary" /></div>
            ) : contents.length === 0 ? (
              <p className="text-sm text-muted-foreground">A Biblioteca ainda não tem conteúdos cadastrados.</p>
            ) : (
              <div className="max-h-[34rem] space-y-3 overflow-y-auto pr-1">
                {contents.map((content) => (
                  <div key={content.id} className="flex items-start justify-between gap-3 rounded-2xl border border-border p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{content.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{content.content_type} · {content.language} · {content.level} · {content.category}{content.duration_label ? ` · ${content.duration_label}` : ""}</p>
                    </div>
                    <button type="button" onClick={() => void deleteContent(content)} className="shrink-0 rounded-full bg-destructive/10 p-2 text-destructive" aria-label={`Excluir ${content.title}`}><Trash2 className="size-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Escopo do Beta:</span> este CMS foi mantido propositalmente simples. Financeiro avançado, analytics detalhado, notificações e gestão escolar continuam fora do bloqueio de lançamento.
        </div>
      </div>
    </AppShell>
  );
}

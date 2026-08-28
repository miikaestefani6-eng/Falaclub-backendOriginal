import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Bell, BookOpen, CreditCard, GraduationCap, Users } from "lucide-react";
import { AppShell, SectionCard, Stat } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";

export const Route = createFileRoute("/master")({ beforeLoad: async () => ({ profile: await requireRole(["super_admin"]) }), component: Master });

const items = [
  [Users, "Usuários", "Gerencie contas e acessos", "/master"],
  [GraduationCap, "Professores", "Acompanhe docentes", "/professor"],
  [BookOpen, "Biblioteca", "Organize conteúdos", "/biblioteca"],
  [CreditCard, "Financeiro", "Acompanhe receitas", "/financeiro"],
  [BarChart3, "Analytics", "Veja indicadores", "/analytics"],
  [Bell, "Notificações", "Central de avisos", "/notificacoes"],
] as const;

function Master() {
  return <AppShell titulo="CMS Master" subtitulo="Gestão completa do FalaClub"><div className="space-y-6"><div className="rounded-3xl bg-gradient-brand p-6 text-primary-foreground shadow-glow"><p className="text-xs font-bold uppercase tracking-[0.16em] opacity-80">Visão geral</p><h2 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">Tudo sob controle.</h2><p className="mt-2 max-w-xl text-sm opacity-85">Um painel central para acompanhar a plataforma sem perder a experiência visual do FalaClub.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat rotulo="Usuários" valor="—" /><Stat rotulo="Professores" valor="—" /><Stat rotulo="Escolas" valor="—" /><Stat rotulo="Creators" valor="—" /></div><SectionCard titulo="Central de gestão" descricao="Acesse rapidamente cada área administrativa."><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(([Icon, label, description, to]) => <Link key={label} to={to} className="group rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="size-5" /></span><div><p className="text-sm font-bold">{label}</p><p className="text-xs text-muted-foreground">{description}</p></div></div></Link>)}</div></SectionCard></div></AppShell>;
}

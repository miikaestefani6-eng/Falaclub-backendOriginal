import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  Building2,
  ChartNoAxesColumn,
  CreditCard,
  GraduationCap,
  Home,
  Layers,
  LogOut,
  MessageCircleHeart,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Logo, MiaAvatar } from "@/components/brand";
import { getCurrentProfile, signOut, type UserRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof Home };
type NavGroup = { titulo: string; itens: NavItem[]; roles: UserRole[] };

const grupos: NavGroup[] = [
  {
    titulo: "Aluno",
    roles: ["student", "super_admin"],
    itens: [
      { to: "/hoje", label: "Hoje", icon: Home },
      { to: "/mia", label: "Falar com a Mia", icon: MessageCircleHeart },
      { to: "/biblioteca", label: "Biblioteca", icon: BookOpen },
      { to: "/flashcards", label: "Flashcards", icon: Layers },
      { to: "/drops", label: "Drops do idioma", icon: Sparkles },
      { to: "/progresso", label: "Progresso", icon: Trophy },
    ],
  },
  {
    titulo: "Painéis",
    roles: ["super_admin", "school_admin", "teacher", "influencer"],
    itens: [
      { to: "/master", label: "CMS Master", icon: Trophy },
      { to: "/escola", label: "CMS Escola", icon: Building2 },
      { to: "/professor", label: "CMS Professor", icon: GraduationCap },
      { to: "/creator", label: "CMS Creator", icon: Users },
    ],
  },
  {
    titulo: "Negócio",
    roles: ["super_admin"],
    itens: [
      { to: "/financeiro", label: "Financeiro", icon: CreditCard },
      { to: "/analytics", label: "Analytics", icon: ChartNoAxesColumn },
      { to: "/notificacoes", label: "Notificações", icon: Bell },
    ],
  },
];

const atalhosMobile: NavItem[] = [
  { to: "/hoje", label: "Hoje", icon: Home },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { to: "/mia", label: "Mia", icon: MessageCircleHeart },
  { to: "/flashcards", label: "Cards", icon: Layers },
];

export function AppShell({ titulo, subtitulo, acao, children }: { titulo: string; subtitulo?: string; acao?: ReactNode; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    getCurrentProfile().then((profile) => {
      if (mounted) setRole(profile?.role ?? null);
    }).catch((error) => console.error("Erro ao carregar permissões:", error));
    return () => { mounted = false; };
  }, []);

  const gruposVisiveis = role ? grupos.filter((grupo) => grupo.roles.includes(role)) : [];
  const isSuperAdmin = role === "super_admin";

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
      await navigate({ to: "/login" });
    } catch (error) {
      console.error("Erro ao sair:", error);
      toast.error("Não foi possível sair da conta. Tente novamente.");
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col gap-6 overflow-y-auto bg-sidebar px-4 py-6 text-sidebar-foreground lg:flex">
        <div className="rounded-2xl bg-sidebar-accent/60 px-3 py-3"><Logo /></div>
        <nav className="flex flex-1 flex-col gap-6">
          {gruposVisiveis.map((grupo) => {
            const itensVisiveis = grupo.itens.filter((item) => {
              if (item.to === "/master") return role === "super_admin";
              if (item.to === "/escola") return role === "school_admin" || role === "super_admin";
              if (item.to === "/professor") return role === "teacher" || role === "super_admin";
              if (item.to === "/creator") return role === "influencer" || role === "super_admin";
              return true;
            });
            if (!itensVisiveis.length) return null;
            return (
              <div key={grupo.titulo}>
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/50">{grupo.titulo}</p>
                <ul className="space-y-1">
                  {itensVisiveis.map((item) => {
                    const ativo = pathname === item.to;
                    return <li key={item.to}><Link to={item.to} className={cn("flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors", ativo ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}><item.icon className="size-4" />{item.label}</Link></li>;
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
        <Link to="/mia" className="flex items-center gap-3 rounded-2xl bg-gradient-mia px-3 py-3 text-sidebar-primary-foreground"><MiaAvatar className="size-9 ring-0" /><span className="text-xs leading-tight"><span className="block font-semibold">Mia está online</span><span className="opacity-80">Bora praticar 5 min?</span></span></Link>
        <button type="button" onClick={() => void handleLogout()} disabled={loggingOut} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:cursor-wait disabled:opacity-60"><LogOut className="size-4" />{loggingOut ? "Saindo..." : "Sair"}</button>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6"><div className="min-w-0"><div className="lg:hidden"><Logo /></div><h1 className="mt-1 truncate text-xl font-bold sm:text-2xl">{titulo}</h1>{subtitulo ? <p className="truncate text-sm text-muted-foreground">{subtitulo}</p> : null}</div><div className="flex shrink-0 items-center gap-2">{acao}{isSuperAdmin ? <Link to="/notificacoes" aria-label="Notificações" className="relative rounded-full border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"><Bell className="size-4" /><span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent" /></Link> : null}</div></div></header>
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden"><ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 py-2">{atalhosMobile.map((item) => { const ativo = pathname === item.to; return <li key={item.to} className="flex-1"><Link to={item.to} className={cn("flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors", ativo ? "text-primary" : "text-muted-foreground")}><item.icon className="size-5" />{item.label}</Link></li>; })}<li className="flex-1"><button type="button" onClick={() => void handleLogout()} disabled={loggingOut} className="flex w-full flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-muted-foreground disabled:opacity-60"><LogOut className="size-5" />Sair</button></li></ul></nav>
    </div>
  );
}

export function SectionCard({ titulo, descricao, acao, children, className }: { titulo?: string; descricao?: string; acao?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={cn("surface-card p-5", className)}>{titulo ? <header className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-base font-bold">{titulo}</h2>{descricao ? <p className="text-sm text-muted-foreground">{descricao}</p> : null}</div>{acao}</header> : null}{children}</section>;
}

export function Stat({ rotulo, valor, delta }: { rotulo: string; valor: string; delta?: string }) {
  return <div className="surface-card p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</p><p className="mt-2 font-display text-2xl font-bold">{valor}</p>{delta ? <p className="mt-1 text-xs font-semibold text-success">{delta}</p> : null}</div>;
}

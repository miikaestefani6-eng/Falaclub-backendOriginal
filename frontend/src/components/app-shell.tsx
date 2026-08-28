import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BookOpen, Home, Layers, LogOut, MessageCircleHeart, Sparkles, Trophy } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { getCurrentProfile, signOut } from "@/lib/auth";
import { Logo, MiaAvatar } from "@/components/brand";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/hoje", label: "Hoje", icon: Home },
  { to: "/mia", label: "Falar com a Mia", icon: MessageCircleHeart },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { to: "/flashcards", label: "Flashcards", icon: Layers },
  { to: "/drops", label: "Drops", icon: Sparkles },
  { to: "/progresso", label: "Progresso", icon: Trophy },
] as const;

export function AppShell({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => { getCurrentProfile().then((p) => setRole(p?.role ?? null)).catch(console.error); }, []);
  async function logout() { await signOut(); await navigate({ to: "/login" }); }
  const visible = role ? nav : nav;
  return <div className="min-h-screen bg-background"><aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col gap-6 bg-sidebar px-4 py-6 text-sidebar-foreground lg:flex"><div className="rounded-2xl bg-sidebar-accent/60 px-3 py-3"><Logo /></div><nav className="flex flex-1 flex-col gap-1">{visible.map((item) => { const active = pathname === item.to; return <Link key={item.to} to={item.to} className={cn("flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium", active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent")}><item.icon className="size-4" />{item.label}</Link>; })}</nav><Link to="/mia" className="flex items-center gap-3 rounded-2xl bg-gradient-mia px-3 py-3 text-white"><MiaAvatar className="size-9" /><span className="text-xs"><b className="block">Mia está online</b><span>Bora praticar?</span></span></Link><button onClick={() => void logout()} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm"><LogOut className="size-4" />Sair</button></aside><div className="lg:pl-64"><header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur"><div className="mx-auto max-w-6xl px-4 py-4 sm:px-6"><div className="lg:hidden mb-2"><Logo /></div><h1 className="font-display text-xl font-bold sm:text-2xl">{titulo}</h1>{subtitulo ? <p className="text-sm text-muted-foreground">{subtitulo}</p> : null}</div></header><main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">{children}</main></div><nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden"><div className="mx-auto flex max-w-lg justify-around px-2 py-2">{nav.slice(0,4).map((item) => <Link key={item.to} to={item.to} className={cn("flex flex-col items-center gap-1 px-2 py-1 text-[11px]", pathname === item.to ? "text-primary" : "text-muted-foreground")}><item.icon className="size-5" />{item.label}</Link>)}</div></nav></div>;
}

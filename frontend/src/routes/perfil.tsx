import { createFileRoute } from "@tanstack/react-router";
import { UserRound, Settings, LogOut } from "lucide-react";
import { AppShell, SectionCard } from "@/components/app-shell";
import { getCurrentProfile } from "@/lib/auth";

export const Route = createFileRoute("/perfil")({ beforeLoad: async () => ({ profile: await getCurrentProfile() }), component: Perfil });

function Perfil() {
  const { profile } = Route.useRouteContext() as { profile: Awaited<ReturnType<typeof getCurrentProfile>> };
  return <AppShell titulo="Perfil" subtitulo="Suas informações e preferências"><div className="grid gap-5 md:grid-cols-2"><SectionCard titulo="Minha conta"><div className="flex items-center gap-4"><div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground"><UserRound /></div><div><p className="font-display text-lg font-bold">{profile?.full_name || "Seu nome"}</p><p className="text-sm text-muted-foreground">{profile?.target_language || "Idioma não definido"} · {profile?.level || "Nível não definido"}</p></div></div></SectionCard><SectionCard titulo="Preferências"><div className="flex items-center gap-3 text-sm"><Settings className="size-5 text-primary" /> Preferências de estudo e notificações</div></SectionCard><SectionCard titulo="Sessão"><div className="flex items-center gap-3 text-sm text-muted-foreground"><LogOut className="size-5" /> A saída da conta continua disponível pelo menu principal.</div></SectionCard></div></AppShell>;
}

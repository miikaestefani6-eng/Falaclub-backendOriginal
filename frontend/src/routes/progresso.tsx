import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
export const Route = createFileRoute("/progresso")({ component: Progresso });
function Progresso() { return <AppShell titulo="Progresso" subtitulo="Acompanhe sua evolução"><div className="surface-card p-6"><Trophy className="size-8 text-primary" /><h2 className="mt-4 font-display text-2xl font-bold">Sua evolução</h2><p className="mt-2 text-sm text-muted-foreground">Os indicadores serão alimentados pelo histórico real do Supabase.</p></div></AppShell>; }

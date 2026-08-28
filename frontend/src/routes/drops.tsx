import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
export const Route = createFileRoute("/drops")({ component: Drops });
function Drops() { return <AppShell titulo="Drops" subtitulo="Uma dose de idioma todos os dias"><div className="surface-card p-6"><Sparkles className="size-8 text-accent" /><h2 className="mt-4 font-display text-2xl font-bold">Drop de hoje</h2><p className="mt-2 text-sm text-muted-foreground">Conteúdo rápido para aprender uma expressão, palavra ou curiosidade.</p></div></AppShell>; }

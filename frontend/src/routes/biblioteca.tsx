import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { AppShell } from "@/components/app-shell";
export const Route = createFileRoute("/biblioteca")({ component: Biblioteca });
function Biblioteca() { return <AppShell titulo="Biblioteca" subtitulo="Conteúdos para praticar no seu nível"><div className="surface-card p-6"><BookOpen className="size-8 text-primary" /><h2 className="mt-4 font-display text-2xl font-bold">Sua biblioteca está pronta</h2><p className="mt-2 text-sm text-muted-foreground">Podcasts, vídeos, músicas, apostilas e aulas serão organizados aqui.</p></div></AppShell>; }

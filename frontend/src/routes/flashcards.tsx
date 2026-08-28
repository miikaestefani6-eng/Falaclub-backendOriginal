import { createFileRoute } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { AppShell } from "@/components/app-shell";
export const Route = createFileRoute("/flashcards")({ component: Flashcards });
function Flashcards() { return <AppShell titulo="Flashcards" subtitulo="Revisão espaçada para fixar o idioma"><div className="surface-card p-6"><Layers className="size-8 text-primary" /><h2 className="mt-4 font-display text-2xl font-bold">Seus flashcards</h2><p className="mt-2 text-sm text-muted-foreground">A base visual do Pixel Perfect foi incorporada; a revisão será conectada aos dados do Supabase na próxima etapa.</p></div></AppShell>; }

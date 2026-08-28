import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, BarChart3, DollarSign, Layers } from "lucide-react";
import { AppShell, SectionCard, Stat } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
export const Route = createFileRoute("/creator")({ beforeLoad: async () => ({ profile: await requireRole(["influencer", "super_admin"]) }), component: Creator });
function Creator() { return <AppShell titulo="CMS Creator" subtitulo="Conteúdos, biblioteca, desempenho e comissões"><div className="grid gap-4 sm:grid-cols-3"><Stat rotulo="Conteúdos" valor="—" /><Stat rotulo="Desempenho" valor="—" /><Stat rotulo="Comissões" valor="—" /></div><div className="mt-5"><SectionCard titulo="Creator Studio"><div className="grid gap-2 sm:grid-cols-2">{[[Layers,"Conteúdos"],[BookOpen,"Biblioteca"],[BarChart3,"Desempenho"],[DollarSign,"Comissões"]].map(([Icon,label]) => <div key={label as string} className="flex items-center gap-3 rounded-2xl border border-border p-4"><Icon className="size-5 text-primary" /><span className="text-sm font-semibold">{label as string}</span></div>)}</div></SectionCard></div></AppShell>; }

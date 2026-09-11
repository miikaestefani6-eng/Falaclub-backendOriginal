import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../styles.css?url";
import { Toaster } from "sonner";
import { requireRole } from "@/lib/auth";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: ({ location }) => {
    if (["/hoje", "/mia", "/biblioteca", "/flashcards", "/drops", "/progresso", "/perfil"].includes(location.pathname)) return requireRole(["student", "super_admin"]);
    return undefined;
  },
  head: () => ({ meta: [{ charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" }, { title: "FalaClub — Aprenda, pratique, fale" }, { name: "description", content: "Plataforma de idiomas com a Mia." }], links: [{ rel: "stylesheet", href: appCss }, { rel: "preconnect", href: "https://fonts.googleapis.com" }, { rel: "preconnect", href: "https://fonts.gstatic.com" }, { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Figtree:wght@400;500;600;700&display=swap" }, { rel: "icon", type: "image/png", href: "/favicon.png" }] }),
  shellComponent: ({ children }: { children: ReactNode }) => <html lang="pt-BR"><head><HeadContent /></head><body>{children}<Scripts /></body></html>,
  component: () => { const queryClient = Route.useRouteContext().queryClient; return <QueryClientProvider client={queryClient}><Outlet /><Toaster /></QueryClientProvider>; },
  notFoundComponent: () => <div className="grid min-h-screen place-items-center"><div className="text-center"><h1 className="font-display text-6xl font-bold text-gradient-brand">404</h1><p className="mt-2 text-muted-foreground">A Mia não encontrou essa página.</p><Link to="/" className="mt-5 inline-block rounded-full bg-gradient-brand px-5 py-2 text-sm font-semibold text-white">Voltar</Link></div></div>,
});

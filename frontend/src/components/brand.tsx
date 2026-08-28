import { cn } from "@/lib/utils";

export function MiaAvatar({ className }: { className?: string }) {
  return <div className={cn("relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-brand p-0.5 shadow-sm", className)}><img src="/mia.png" alt="Mia" className="size-full rounded-full object-cover bg-background" /></div>;
}

export function Logotipo({ className }: { className?: string }) {
  return <div className={cn("flex items-center gap-2 font-display text-xl font-bold tracking-tight text-primary", className)}><span className="flex size-8 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-sm">F</span><span>FalaClub</span></div>;
}

export function MiaFull({ className }: { className?: string }) {
  return <div className={cn("flex items-center gap-3", className)}><MiaAvatar className="size-12" /><div><p className="font-display text-lg font-bold">Mia</p><p className="text-xs text-muted-foreground">Sua tutora de idiomas com IA</p></div></div>;
}

export const Logo = Logotipo;

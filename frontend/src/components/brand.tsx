import { cn } from "@/lib/utils";

export function MiaAvatar({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-brand p-0.5 shadow-sm ring-2 ring-primary/20", className)}>
      <svg viewBox="0 0 100 100" role="img" aria-label="Mia, tutora de idiomas com IA" className="size-full rounded-full bg-background">
        <defs><linearGradient id="mia-bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#f4d8ff"/><stop offset="0.5" stopColor="#ffd9e8"/><stop offset="1" stopColor="#ffe4bd"/></linearGradient></defs>
        <circle cx="50" cy="50" r="50" fill="url(#mia-bg)"/>
        <path d="M23 91c2-18 13-29 27-29s25 11 27 29" fill="#7c3aed" opacity=".9"/>
        <circle cx="50" cy="45" r="23" fill="#ffd7c2"/>
        <path d="M27 44c-1-22 10-34 27-34 14 0 24 9 25 27-7-7-15-10-24-10-9 0-18 5-28 17Z" fill="#5b2a86"/>
        <path d="M31 36c5-12 13-18 24-18 10 0 18 5 22 14-12-5-28-5-46 4Z" fill="#7e3f9f"/>
        <circle cx="42" cy="46" r="2.5" fill="#35223f"/><circle cx="59" cy="46" r="2.5" fill="#35223f"/>
        <path d="M45 55c3 3 7 3 10 0" fill="none" stroke="#b45372" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M37 66c7 5 19 5 26 0" fill="#f5b6c9" opacity=".7"/>
      </svg>
    </div>
  );
}

export function Logotipo({ className }: { className?: string }) {
  return <div className={cn("flex items-center gap-2 font-display text-xl font-bold tracking-tight text-primary", className)}><span className="flex size-8 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-sm">F</span><span>FalaClub</span></div>;
}

export function MiaFull({ className }: { className?: string }) {
  return <div className={cn("flex items-center gap-4", className)}><MiaAvatar className="size-16" /><div className="text-left"><p className="font-display text-xl font-bold">Mia</p><p className="mt-0.5 text-sm text-muted-foreground">Sua tutora de idiomas com IA</p><span className="mt-2 inline-flex rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-secondary-foreground">Conversa por voz + texto</span></div></div>;
}

export const Logo = Logotipo;

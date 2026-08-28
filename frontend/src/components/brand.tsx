import { cn } from "@/lib/utils";

export function MiaAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-brand p-0.5 shadow-sm ring-2 ring-primary/20",
        className
      )}
    >
      <img
        src="https://api.dicebear.com/7.x/bottts/svg?seed=Mia&backgroundColor=b6e3f4,c0aede,d1d4f9"
        alt="Mia Avatar"
        className="size-full rounded-full object-cover bg-background"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

export function Logotipo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 font-display text-xl font-bold tracking-tight text-primary", className)}>
      <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-sm">F</span>
      <span>FalaClub</span>
    </div>
  );
}

export function MiaFull({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <MiaAvatar className="size-12" />
      <div>
        <p className="font-display text-lg font-bold">Mia</p>
        <p className="text-xs text-muted-foreground">Sua tutora de idiomas com IA</p>
      </div>
    </div>
  );
}

export const Logo = Logotipo;

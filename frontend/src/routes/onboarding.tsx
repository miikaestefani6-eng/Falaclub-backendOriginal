import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

const studyTimeOptions = [15, 20, 30, 45, 60];

function Onboarding() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [language, setLanguage] = useState("Inglês");
  const [level, setLevel] = useState("A1");
  const [goal, setGoal] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();

    const normalizedName = fullName.trim();
    const normalizedGoal = goal.trim();
    if (!normalizedName || !normalizedGoal) {
      setErrorMessage("Preencha seu nome e objetivo para continuar.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Sessão expirada.");

      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: normalizedName,
          target_language: language,
          level,
          goal: normalizedGoal,
          daily_minutes: dailyMinutes,
        },
        { onConflict: "id" },
      );

      if (error) throw error;
      await navigate({ to: "/hoje" });
    } catch (error) {
      console.error("Erro ao salvar onboarding:", error);
      setErrorMessage("Não foi possível salvar sua jornada agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-8">
      <form onSubmit={save} className="surface-card w-full max-w-lg p-6">
        <h1 className="font-display text-2xl font-bold">Vamos preparar sua jornada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Conte o que você está estudando e quanto tempo realmente cabe na sua rotina. O FalaClub usa isso para orientar sua prática diária.
        </p>

        {errorMessage && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">
            Seu nome
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3"
            />
          </label>

          <label className="block text-sm font-semibold">
            Idioma
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3"
            >
              <option>Inglês</option>
              <option>Francês</option>
              <option>Espanhol</option>
              <option>Italiano</option>
              <option>Alemão</option>
            </select>
          </label>

          <label className="block text-sm font-semibold">
            Nível
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3"
            >
              <option>A1</option>
              <option>A2</option>
              <option>B1</option>
              <option>B2</option>
              <option>C1</option>
              <option>C2</option>
            </select>
          </label>

          <label className="block text-sm font-semibold">
            Objetivo
            <input
              required
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3"
              placeholder="Ex.: conversar em viagens"
            />
          </label>

          <label className="block text-sm font-semibold">
            Quanto tempo você consegue estudar por dia?
            <select
              value={dailyMinutes}
              onChange={(e) => setDailyMinutes(Number(e.target.value))}
              className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3"
            >
              {studyTimeOptions.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutos
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Escolha um tempo realista. Você poderá ajustar isso depois.
            </span>
          </label>

          <button
            disabled={loading}
            className="h-11 w-full rounded-full bg-gradient-brand font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Montar minha rotina"}
          </button>
        </div>
      </form>
    </div>
  );
}

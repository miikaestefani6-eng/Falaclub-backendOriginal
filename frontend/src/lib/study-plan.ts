export type StudyPlanRoute = "/mia" | "/biblioteca" | "/flashcards" | "/drops";

export type StudyPlanItem = {
  id: string;
  title: string;
  type: string;
  minutes: number;
  to: StudyPlanRoute;
  skillKey: "speaking" | "content" | "vocabulary" | "culture";
};

export type StudyPlanDay = {
  weekday: number;
  label: string;
  focus: string;
  items: StudyPlanItem[];
};

type BuildStudyPlanInput = {
  level?: string | null;
  goal?: string | null;
  dailyMinutes?: number | null;
};

const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function splitMinutes(total: number) {
  const safeTotal = Math.max(15, Math.min(total || 30, 120));
  const primary = Math.max(10, Math.round(safeTotal * 0.65));
  const secondary = Math.max(5, safeTotal - primary);
  return [primary, secondary] as const;
}

function includesAny(value: string, words: string[]) {
  return words.some((word) => value.includes(word));
}

export function buildWeeklyStudyPlan({ level, goal, dailyMinutes }: BuildStudyPlanInput): StudyPlanDay[] {
  const normalizedGoal = (goal || "").toLowerCase();
  const normalizedLevel = (level || "A1").toUpperCase();
  const [primaryMinutes, secondaryMinutes] = splitMinutes(dailyMinutes ?? 30);

  const conversationPriority = includesAny(normalizedGoal, ["convers", "fala", "falar", "fluência", "fluencia", "viagem", "viajar"]);
  const immersionPriority = includesAny(normalizedGoal, ["música", "musica", "série", "serie", "filme", "cultura", "escuta", "ouvir", "listening"]);
  const readingPriority = includesAny(normalizedGoal, ["leitura", "ler", "livro", "gramática", "gramatica", "prova", "certificação", "certificacao"]);
  const beginner = normalizedLevel === "A1" || normalizedLevel === "A2";

  const speakingItem = (id: string, title = "Prática guiada com a Mia"): StudyPlanItem => ({ id, title, type: "Conversação", minutes: primaryMinutes, to: "/mia", skillKey: "speaking" });
  const contentItem = (id: string, title: string): StudyPlanItem => ({ id, title, type: beginner ? "Estudo guiado" : "Imersão", minutes: primaryMinutes, to: "/biblioteca", skillKey: "content" });
  const vocabularyItem = (id: string, title = "Revisar vocabulário e flashcards"): StudyPlanItem => ({ id, title, type: "Vocabulário", minutes: secondaryMinutes, to: "/flashcards", skillKey: "vocabulary" });
  const cultureItem = (id: string, title = "Explorar um Drop cultural"): StudyPlanItem => ({ id, title, type: "Cultura", minutes: secondaryMinutes, to: "/drops", skillKey: "culture" });

  const mondayPrimary = readingPriority
    ? contentItem("mon-content", beginner ? "Aula curta + leitura do seu nível" : "Leitura ou aula focada no seu objetivo")
    : contentItem("mon-content", beginner ? "Aula curta do seu nível" : "Conteúdo guiado do seu nível");

  const tuesdayPrimary = immersionPriority
    ? contentItem("tue-immersion", "Imersão com vídeo, áudio, música ou podcast")
    : contentItem("tue-listening", beginner ? "Escuta guiada do seu nível" : "Listening com conteúdo real");

  const wednesdayPrimary = speakingItem("wed-speaking", conversationPriority ? "Conversa focada no seu objetivo" : "Conversa guiada com a Mia");

  const thursdayPrimary = readingPriority
    ? contentItem("thu-reading", "Leitura guiada + expressões úteis")
    : contentItem("thu-content", "Aula ou conteúdo para consolidar a semana");

  const fridayPrimary = conversationPriority
    ? speakingItem("fri-speaking", "Conversa de fechamento da semana")
    : contentItem("fri-immersion", "Imersão leve com conteúdo do seu interesse");

  const saturdayPrimary = immersionPriority
    ? contentItem("sat-immersion", "Imersão livre: série, música, vídeo ou podcast")
    : contentItem("sat-content", "Conteúdo leve no idioma que você está estudando");

  const sundayPrimary = vocabularyItem("sun-review", "Revisão leve do vocabulário da semana");

  return [
    { weekday: 1, label: dayLabels[1], focus: "Base da semana", items: [mondayPrimary, vocabularyItem("mon-vocab")] },
    { weekday: 2, label: dayLabels[2], focus: "Escuta e imersão", items: [tuesdayPrimary, cultureItem("tue-culture")] },
    { weekday: 3, label: dayLabels[3], focus: "Produção e conversa", items: [wednesdayPrimary, vocabularyItem("wed-vocab")] },
    { weekday: 4, label: dayLabels[4], focus: "Leitura e consolidação", items: [thursdayPrimary, vocabularyItem("thu-vocab")] },
    { weekday: 5, label: dayLabels[5], focus: conversationPriority ? "Conversação" : "Uso real do idioma", items: [fridayPrimary, cultureItem("fri-culture")] },
    { weekday: 6, label: dayLabels[6], focus: "Imersão leve", items: [saturdayPrimary, cultureItem("sat-culture")] },
    { weekday: 0, label: dayLabels[0], focus: "Revisão e descanso ativo", items: [sundayPrimary] },
  ];
}

export function getTodayStudyPlan(plan: StudyPlanDay[], date = new Date()) {
  return plan.find((day) => day.weekday === date.getDay()) ?? plan[0];
}

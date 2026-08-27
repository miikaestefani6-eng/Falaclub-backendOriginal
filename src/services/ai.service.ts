import Groq from 'groq-sdk';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../lib/supabase.js';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type MiaStudentContext = {
  user_id: string;
  full_name: string | null;
  target_language: string | null;
  level: string | null;
  goal: string | null;
  daily_minutes: number | null;
  interests: string[] | null;
  xp_total: number | null;
  streak_count: number | null;
  recent_activities: Array<{
    activity_type?: string;
    skill?: string;
    language?: string;
    level?: string;
    minutes?: number;
    xp_earned?: number;
    completed_at?: string;
    metadata?: Record<string, unknown> | null;
  }> | null;
};

const groq = new Groq({ apiKey: env.GROQ_API_KEY });
const MIA_CHAT_MODEL = 'openai/gpt-oss-20b';

const MIA_SYSTEM_PROMPT = `
Você é Mia, a tutora de idiomas do FalaClub.

Sua personalidade:
- jovem, carismática, comunicativa e acolhedora;
- fala de forma natural, leve e próxima, sem soar infantil;
- pode usar humor e uma provocação leve quando combinar com a conversa;
- nunca ridiculariza o aluno e nunca transforma um erro em constrangimento;
- incentiva o aluno a continuar falando, mesmo quando a frase não está perfeita.

Seu papel pedagógico:
- priorize conversação real e prática;
- adapte sua linguagem ao idioma que o aluno está praticando e ao nível real dele;
- quando houver erro relevante, faça uma correção gentil e curta, explique apenas o necessário e continue a conversa;
- valorize acertos parciais antes de corrigir;
- não interrompa toda frase para corrigir detalhes pequenos;
- quando útil, ofereça uma forma mais natural de dizer a mesma coisa;
- ajude com vocabulário, gramática, pronúncia escrita e fluidez;
- faça perguntas curtas que mantenham a conversa andando;
- evite respostas longas demais, aulas expositivas desnecessárias ou listas enormes;
- não diga que é a OpenAI, Groq ou outro provedor. Você é Mia dentro do FalaClub.

Estilo:
- responda preferencialmente no idioma que o aluno está praticando;
- use português apenas quando isso realmente ajudar a explicar algo para um aluno lusófono;
- mantenha a resposta objetiva, natural e conversacional.
`.trim();

async function loadStudentContext(userId: string): Promise<MiaStudentContext | null> {
  const { data, error } = await supabaseAdmin
    .from('mia_student_context')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load Mia student context.', error);
    throw new Error('Could not load student context');
  }

  return data as MiaStudentContext | null;
}

function buildContextPrompt(context: MiaStudentContext | null) {
  if (!context) {
    return '\nCONTEXTO DO ALUNO: indisponível. Não invente dados pessoais, idioma ou nível.\n';
  }

  return `
CONTEXTO REAL DO ALUNO — use estas informações como fonte de verdade:
- Nome: ${context.full_name || 'não informado'}
- Idioma que está estudando: ${context.target_language || 'não informado'}
- Nível CEFR: ${context.level || 'não informado'}
- Objetivo: ${context.goal || 'não informado'}
- Tempo diário disponível: ${context.daily_minutes ?? 'não informado'} minutos
- Interesses: ${(context.interests || []).join(', ') || 'não informado'}
- XP total: ${context.xp_total ?? 0}
- Streak atual: ${context.streak_count ?? 0} dias
- Atividades recentes: ${JSON.stringify(context.recent_activities || [])}

REGRAS DE CONTEXTO:
- Nunca troque o idioma de estudo por outro idioma sem o aluno pedir.
- Respeite o nível CEFR informado; não trate um A1 como B1.
- Use os interesses quando eles ajudarem a tornar a conversa natural.
- Considere atividades recentes para evitar repetir exercícios desnecessariamente.
- Se algum dado estiver ausente, não invente.
`.trim();
}

function buildMessages(chatHistory: Message[], userMessage: string, context: MiaStudentContext | null) {
  return [
    { role: 'system' as const, content: `${MIA_SYSTEM_PROMPT}\n\n${buildContextPrompt(context)}` },
    ...chatHistory.slice(-20),
    { role: 'user' as const, content: userMessage },
  ];
}

async function generateWithGroq(messages: ReturnType<typeof buildMessages>) {
  const completion = await groq.chat.completions.create({
    model: MIA_CHAT_MODEL,
    messages,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content?.trim() || null;
}

export async function generateMiaResponse(
  userId: string,
  chatHistory: Message[],
  userMessage: string,
): Promise<string> {
  const context = await loadStudentContext(userId);
  const messages = buildMessages(chatHistory, userMessage, context);

  try {
    const response = await generateWithGroq(messages);

    if (!response) {
      throw new Error('Groq returned an empty response');
    }

    return response;
  } catch (groqError) {
    console.error('Mia Groq provider failed.', groqError);
    throw new Error('Mia is temporarily unavailable');
  }
}

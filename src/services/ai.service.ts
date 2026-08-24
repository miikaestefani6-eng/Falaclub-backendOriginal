import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { env } from '../config/env.js';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
const groq = new Groq({ apiKey: env.GROQ_API_KEY });

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
- adapte sua linguagem ao idioma que o aluno está praticando e ao nível aparente dele;
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
- mantenha a resposta objetiva, natural e conversacional;
- ocasionalmente pode usar expressões como “me pegou?” ou “vem cá” quando fizer sentido, sem repetir bordões de forma artificial.
`.trim();

function buildMessages(chatHistory: Message[], userMessage: string) {
  return [
    { role: 'system' as const, content: MIA_SYSTEM_PROMPT },
    ...chatHistory.slice(-20),
    { role: 'user' as const, content: userMessage },
  ];
}

async function generateWithOpenAI(messages: ReturnType<typeof buildMessages>) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content?.trim() || null;
}

async function generateWithGroq(messages: ReturnType<typeof buildMessages>) {
  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content?.trim() || null;
}

export async function generateMiaResponse(
  chatHistory: Message[],
  userMessage: string,
): Promise<string> {
  const messages = buildMessages(chatHistory, userMessage);

  try {
    const response = await generateWithOpenAI(messages);

    if (response) {
      return response;
    }

    throw new Error('OpenAI returned an empty response');
  } catch (openAiError) {
    console.error('Mia primary provider failed; using Groq fallback.', openAiError);

    try {
      const fallbackResponse = await generateWithGroq(messages);

      if (!fallbackResponse) {
        throw new Error('Groq returned an empty response');
      }

      return fallbackResponse;
    } catch (groqError) {
      console.error('Mia fallback provider failed.', groqError);
      throw new Error('Mia is temporarily unavailable');
    }
  }
}

import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { env } from '../config/env.js';

const groq = new Groq({ apiKey: env.GROQ_API_KEY });
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const STT_MODEL = 'whisper-large-v3-turbo';
const TTS_MODEL = 'tts-1';
const TTS_VOICE = 'nova';

export class VoiceServiceError extends Error {
  constructor(
    public code: 'stt_failed' | 'tts_failed' | 'quota_exceeded' | 'timeout',
    message: string,
  ) {
    super(message);
  }
}

function isQuotaError(error: unknown) {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { status?: number; code?: string };
  return candidate.status === 429 || candidate.code === 'insufficient_quota';
}

function isTimeoutError(error: unknown) {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { code?: string; name?: string };
  return candidate.code === 'ETIMEDOUT' || candidate.name === 'TimeoutError';
}

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  try {
    const bytes = Uint8Array.from(audioBuffer);
    const file = new File([bytes], filename, { type: 'application/octet-stream' });
    const transcription = await groq.audio.transcriptions.create({
      file,
      model: STT_MODEL,
      response_format: 'json',
      temperature: 0,
    });

    const text = transcription.text?.trim() ?? '';

    if (!text) {
      throw new VoiceServiceError('stt_failed', 'Audio could not be transcribed');
    }

    return text;
  } catch (error) {
    if (error instanceof VoiceServiceError) {
      throw error;
    }

    if (isQuotaError(error)) {
      throw new VoiceServiceError('quota_exceeded', 'Speech-to-text quota exceeded');
    }

    if (isTimeoutError(error)) {
      throw new VoiceServiceError('timeout', 'Speech-to-text request timed out');
    }

    console.error('Voice STT failed', error);
    throw new VoiceServiceError('stt_failed', 'Audio could not be transcribed');
  }
}

export async function synthesizeSpeech(text: string): Promise<Buffer> {
  try {
    const speech = await openai.audio.speech.create({
      model: TTS_MODEL,
      voice: TTS_VOICE,
      input: text,
      response_format: 'mp3',
    });

    return Buffer.from(await speech.arrayBuffer());
  } catch (error) {
    if (isQuotaError(error)) {
      throw new VoiceServiceError('quota_exceeded', 'Text-to-speech quota exceeded');
    }

    if (isTimeoutError(error)) {
      throw new VoiceServiceError('timeout', 'Text-to-speech request timed out');
    }

    console.error('Voice TTS failed', error);
    throw new VoiceServiceError('tts_failed', 'Speech synthesis failed');
  }
}

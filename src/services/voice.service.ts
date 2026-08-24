import Groq from 'groq-sdk';
import { env } from '../config/env.js';

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

const STT_MODEL = 'whisper-large-v3-turbo';
const TTS_MODEL = 'eleven_flash_v2_5';
const TTS_OUTPUT_FORMAT = 'mp3_44100_128';

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
  return candidate.code === 'ETIMEDOUT' || candidate.name === 'TimeoutError' || candidate.name === 'AbortError';
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
  if (!env.ELEVENLABS_API_KEY) {
    throw new VoiceServiceError('tts_failed', 'ElevenLabs API key is not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${env.ELEVENLABS_VOICE_ID}?output_format=${TTS_OUTPUT_FORMAT}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: TTS_MODEL,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
        signal: controller.signal,
      },
    );

    if (response.status === 429) {
      throw new VoiceServiceError('quota_exceeded', 'Text-to-speech quota exceeded');
    }

    if (!response.ok) {
      const body = await response.text();
      console.warn('ElevenLabs TTS request failed', {
        status: response.status,
        body: body.slice(0, 300),
      });
      throw new VoiceServiceError('tts_failed', 'Speech synthesis failed');
    }

    const audio = Buffer.from(await response.arrayBuffer());

    if (audio.length === 0) {
      throw new VoiceServiceError('tts_failed', 'Speech synthesis returned empty audio');
    }

    return audio;
  } catch (error) {
    if (error instanceof VoiceServiceError) {
      throw error;
    }

    if (isTimeoutError(error)) {
      throw new VoiceServiceError('timeout', 'Text-to-speech request timed out');
    }

    console.error('Voice TTS failed', error);
    throw new VoiceServiceError('tts_failed', 'Speech synthesis failed');
  } finally {
    clearTimeout(timeout);
  }
}

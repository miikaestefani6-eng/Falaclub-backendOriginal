import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { audioUpload } from '../middleware/audio-upload.middleware.js';
import { chatRateLimit } from '../middleware/chat-rate-limit.middleware.js';
import { ChatServiceError, processChatMessage } from '../services/chat.service.js';
import { transcribeAudio, VoiceServiceError } from '../services/voice.service.js';

export const chatRouter = Router();

const chatBodySchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1, 'Message is required').max(4000, 'Message is too long'),
});

const voiceBodySchema = z.object({
  conversationId: z.preprocess((value) => (value === '' || value === null ? undefined : value), z.string().uuid().optional()),
});

function handleKnownError(error: unknown) {
  if (error instanceof ChatServiceError) return { statusCode: error.statusCode, message: error.message };
  if (error instanceof VoiceServiceError) {
    if (error.code === 'stt_failed') return { statusCode: 400, message: 'Audio could not be transcribed' };
    if (error.code === 'quota_exceeded' || error.code === 'timeout') return { statusCode: 503, message: 'Voice service is temporarily unavailable' };
    return { statusCode: 503, message: 'Voice service is temporarily unavailable' };
  }
  return null;
}

chatRouter.post('/', requireAuth, chatRateLimit, async (request, response) => {
  try {
    const parsed = chatBodySchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { user } = request as AuthenticatedRequest;
    const chatResult = await processChatMessage({ userId: user.id, conversationId: parsed.data.conversationId, message: parsed.data.message });
    response.status(200).json(chatResult);
  } catch (error) {
    const knownError = handleKnownError(error);
    if (knownError) {
      response.status(knownError.statusCode).json({ error: knownError.message });
      return;
    }
    console.error('Unexpected chat route error', error);
    response.status(500).json({ error: 'Internal server error' });
  }
});

chatRouter.post('/voice', requireAuth, chatRateLimit, audioUpload, async (request, response) => {
  try {
    const parsed = voiceBodySchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten().fieldErrors });
      return;
    }
    if (!request.file) {
      response.status(400).json({ error: 'Audio file is required' });
      return;
    }

    const { user } = request as AuthenticatedRequest;
    const userTranscript = await transcribeAudio(request.file.buffer, request.file.originalname);
    if (!userTranscript.trim()) {
      response.status(400).json({ error: 'Audio could not be transcribed' });
      return;
    }

    const chatResult = await processChatMessage({ userId: user.id, conversationId: parsed.data.conversationId, message: userTranscript, inputMode: 'audio' });

    response.status(200).json({
      conversationId: chatResult.conversationId,
      userTranscript,
      replyText: chatResult.reply,
      messageId: chatResult.messageId,
    });
  } catch (error) {
    const knownError = handleKnownError(error);
    if (knownError) {
      response.status(knownError.statusCode).json({ error: knownError.message });
      return;
    }
    console.error('Unexpected voice chat route error', error);
    response.status(500).json({ error: 'Internal server error' });
  }
});

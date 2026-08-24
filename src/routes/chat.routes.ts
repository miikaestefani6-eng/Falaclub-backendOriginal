import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { generateMiaResponse, type Message } from '../services/ai.service.js';

export const chatRouter = Router();

const chatBodySchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1, 'Message is required').max(4000, 'Message is too long'),
});

class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

chatRouter.post('/', requireAuth, async (request, response) => {
  try {
    const parsed = chatBodySchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { user } = request as AuthenticatedRequest;
    const { message } = parsed.data;
    let conversationId = parsed.data.conversationId;

    if (conversationId) {
      const { data: existingConversation, error: conversationError } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (conversationError) {
        throw new HttpError(500, 'Could not load conversation');
      }

      if (!existingConversation) {
        throw new HttpError(404, 'Conversation not found');
      }
    } else {
      const { data: newConversation, error: createConversationError } = await supabaseAdmin
        .from('conversations')
        .insert({
          user_id: user.id,
          channel: 'app',
        })
        .select('id')
        .single();

      if (createConversationError || !newConversation) {
        console.error('Supabase conversations INSERT failed', {
          message: createConversationError?.message,
          code: createConversationError?.code,
          details: createConversationError?.details,
          hint: createConversationError?.hint,
          userIdAttempted: user.id,
          returnedConversation: Boolean(newConversation),
        });

        throw new HttpError(500, 'Could not create conversation');
      }

      conversationId = newConversation.id;
    }

    const { data: savedUserMessage, error: userMessageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender: 'user',
        content: message,
      })
      .select('id')
      .single();

    if (userMessageError || !savedUserMessage) {
      throw new HttpError(500, 'Could not save user message');
    }

    const { data: recentMessages, error: historyError } = await supabaseAdmin
      .from('messages')
      .select('id, sender, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(21);

    if (historyError) {
      throw new HttpError(500, 'Could not load conversation history');
    }

    const chatHistory: Message[] = (recentMessages ?? [])
      .filter((item) => item.id !== savedUserMessage.id)
      .slice(0, 20)
      .reverse()
      .filter((item): item is typeof item & { sender: 'user' | 'assistant' } =>
        item.sender === 'user' || item.sender === 'assistant',
      )
      .map((item) => ({ role: item.sender, content: item.content }));

    let responseMia: string;

    try {
      responseMia = await generateMiaResponse(chatHistory, message);
    } catch {
      throw new HttpError(503, 'Mia is temporarily unavailable');
    }

    const { data: savedMiaMessage, error: miaMessageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender: 'assistant',
        content: responseMia,
      })
      .select('id')
      .single();

    if (miaMessageError || !savedMiaMessage) {
      throw new HttpError(500, 'Could not save Mia response');
    }

    response.status(200).json({
      conversationId,
      reply: responseMia,
      messageId: savedMiaMessage.id,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }

    console.error('Unexpected chat route error', error);
    response.status(500).json({ error: 'Internal server error' });
  }
});

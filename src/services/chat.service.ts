import { supabaseAdmin } from '../lib/supabase.js';
import { generateMiaResponse, type Message } from './ai.service.js';

export class ChatServiceError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export type ProcessChatInput = {
  userId: string;
  message: string;
  conversationId?: string;
};

export type ProcessChatResult = {
  conversationId: string;
  reply: string;
  messageId: string;
};

export async function processChatMessage({
  userId,
  message,
  conversationId,
}: ProcessChatInput): Promise<ProcessChatResult> {
  let activeConversationId: string;

  if (conversationId) {
    const { data: existingConversation, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (conversationError) {
      throw new ChatServiceError(500, 'Could not load conversation');
    }

    if (!existingConversation) {
      throw new ChatServiceError(404, 'Conversation not found');
    }

    activeConversationId = conversationId;
  } else {
    const { data: newConversation, error: createConversationError } = await supabaseAdmin
      .from('conversations')
      .insert({ user_id: userId, channel: 'app' })
      .select('id')
      .single();

    if (createConversationError || !newConversation) {
      throw new ChatServiceError(500, 'Could not create conversation');
    }

    activeConversationId = newConversation.id;
  }

  const { data: savedUserMessage, error: userMessageError } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: activeConversationId,
      sender: 'user',
      content: message,
    })
    .select('id')
    .single();

  if (userMessageError || !savedUserMessage) {
    throw new ChatServiceError(500, 'Could not save user message');
  }

  const { data: recentMessages, error: historyError } = await supabaseAdmin
    .from('messages')
    .select('id, sender, content, created_at')
    .eq('conversation_id', activeConversationId)
    .order('created_at', { ascending: false })
    .limit(21);

  if (historyError) {
    throw new ChatServiceError(500, 'Could not load conversation history');
  }

  const chatHistory: Message[] = (recentMessages ?? [])
    .filter((item) => item.id !== savedUserMessage.id)
    .slice(0, 20)
    .reverse()
    .filter((item): item is typeof item & { sender: 'user' | 'assistant' } =>
      item.sender === 'user' || item.sender === 'assistant',
    )
    .map((item) => ({ role: item.sender, content: item.content }));

  let reply: string;

  try {
    reply = await generateMiaResponse(chatHistory, message);
  } catch {
    throw new ChatServiceError(503, 'Mia is temporarily unavailable');
  }

  const { data: savedMiaMessage, error: miaMessageError } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: activeConversationId,
      sender: 'assistant',
      content: reply,
    })
    .select('id')
    .single();

  if (miaMessageError || !savedMiaMessage) {
    throw new ChatServiceError(500, 'Could not save Mia response');
  }

  return {
    conversationId: activeConversationId,
    reply,
    messageId: savedMiaMessage.id,
  };
}

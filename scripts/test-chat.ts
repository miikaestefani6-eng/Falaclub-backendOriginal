import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ACCESS_TOKEN) {
  throw new Error(
    'Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ACCESS_TOKEN in environment.',
  );
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Bonjour Mia ! Je veux pratiquer mon français aujourd’hui.',
    }),
  });

  const payload = (await response.json()) as {
    conversationId?: string;
    reply?: string;
    messageId?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(`Chat request failed (${response.status}): ${JSON.stringify(payload)}`);
  }

  if (!payload.conversationId || !payload.reply || !payload.messageId) {
    throw new Error(`Unexpected response payload: ${JSON.stringify(payload)}`);
  }

  const { data: persistedMessages, error } = await admin
    .from('messages')
    .select('id, sender, content, created_at')
    .eq('conversation_id', payload.conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Could not verify persisted messages: ${error.message}`);
  }

  const userMessage = persistedMessages?.find((message) => message.sender === 'user');
  const assistantMessage = persistedMessages?.find(
    (message) => message.id === payload.messageId && message.sender === 'assistant',
  );

  if (!userMessage || !assistantMessage) {
    throw new Error('Route responded, but expected user/assistant messages were not persisted.');
  }

  console.log('✅ /api/chat responded successfully');
  console.log(`conversationId: ${payload.conversationId}`);
  console.log(`messageId: ${payload.messageId}`);
  console.log(`Mia: ${payload.reply}`);
  console.log(`✅ ${persistedMessages?.length ?? 0} message(s) found in Supabase`);
}

main().catch((error) => {
  console.error('❌ Chat smoke test failed');
  console.error(error);
  process.exit(1);
});

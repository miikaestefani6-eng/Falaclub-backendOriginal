import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const RENDER_API_URL = process.env.RENDER_API_URL?.replace(/\/$/, '');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

if (!RENDER_API_URL || !SUPABASE_URL || !SUPABASE_ANON_KEY || !TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error(
    'Missing RENDER_API_URL, SUPABASE_URL, SUPABASE_ANON_KEY, TEST_USER_EMAIL or TEST_USER_PASSWORD.',
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

type ChatResponse = {
  conversationId: string;
  reply: string;
  messageId: string;
};

async function assertOk(response: Response, label: string) {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${label} failed (${response.status}): ${body}`);
  }
}

async function sendChat(jwt: string, body: { message: string; conversationId?: string }) {
  const response = await fetch(`${RENDER_API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  await assertOk(response, 'POST /api/chat');
  const payload = (await response.json()) as ChatResponse;

  if (!payload.conversationId || !payload.reply || !payload.messageId) {
    throw new Error(`Unexpected chat response: ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function main() {
  console.log('1/6 Checking Render health...');
  const healthResponse = await fetch(`${RENDER_API_URL}/health`);
  await assertOk(healthResponse, 'GET /health');
  const health = await healthResponse.json();
  console.log('✅ Health OK:', health);

  console.log('2/6 Logging in test user with Supabase Auth...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  if (authError || !authData.session?.access_token || !authData.user) {
    throw new Error(`Supabase login failed: ${authError?.message ?? 'No session returned'}`);
  }

  const jwt = authData.session.access_token;
  console.log(`✅ Auth OK for user ${authData.user.id}`);

  console.log('3/6 Sending first message to Mia...');
  const first = await sendChat(jwt, {
    message: "Hello Mia! I'm ready to learn English.",
  });

  console.log('✅ First reply');
  console.log('conversationId:', first.conversationId);
  console.log('messageId:', first.messageId);
  console.log('Mia:', first.reply);

  console.log('4/6 Sending second message in the same conversation...');
  const second = await sendChat(jwt, {
    conversationId: first.conversationId,
    message: 'Can you remember what I just told you and ask me a follow-up question?',
  });

  if (second.conversationId !== first.conversationId) {
    throw new Error('Second request returned a different conversationId.');
  }

  console.log('✅ Context request returned in the same conversation');
  console.log('messageId:', second.messageId);
  console.log('Mia:', second.reply);

  console.log('5/6 Verifying conversation persistence through authenticated RLS...');
  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('id, user_id, channel, created_at')
    .eq('id', first.conversationId)
    .single();

  if (conversationError || !conversation) {
    throw new Error(`Conversation persistence check failed: ${conversationError?.message}`);
  }

  if (conversation.user_id !== authData.user.id || conversation.channel !== 'app') {
    throw new Error(`Unexpected conversation row: ${JSON.stringify(conversation)}`);
  }

  console.log('✅ Conversation persisted and owned by test user');

  console.log('6/6 Verifying messages persistence through authenticated RLS...');
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('id, conversation_id, sender, content, created_at')
    .eq('conversation_id', first.conversationId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    throw new Error(`Messages persistence check failed: ${messagesError.message}`);
  }

  const userMessages = messages?.filter((message) => message.sender === 'user') ?? [];
  const assistantMessages = messages?.filter((message) => message.sender === 'assistant') ?? [];

  if (userMessages.length < 2 || assistantMessages.length < 2) {
    throw new Error(
      `Expected at least 2 user and 2 assistant messages, got ${userMessages.length} user / ${assistantMessages.length} assistant.`,
    );
  }

  if (!assistantMessages.some((message) => message.id === first.messageId)) {
    throw new Error('First assistant messageId was not found in Supabase.');
  }

  if (!assistantMessages.some((message) => message.id === second.messageId)) {
    throw new Error('Second assistant messageId was not found in Supabase.');
  }

  console.log(`✅ Persistence OK: ${messages?.length ?? 0} messages found`);
  console.log('\n🎉 E2E PASSED — Render + Supabase Auth + Mia + persistence are working end-to-end.');
}

main().catch((error) => {
  console.error('\n❌ E2E FAILED');
  console.error(error);
  process.exit(1);
});

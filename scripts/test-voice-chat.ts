import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const API_BASE_URL = (process.env.RENDER_API_URL ?? process.env.API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error('Missing SUPABASE_URL, SUPABASE_ANON_KEY, TEST_USER_EMAIL or TEST_USER_PASSWORD.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Small MP3 fixture generated from the spoken phrase "Hello Mia."
const SAMPLE_MP3_BASE64 = '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UpZg8wUNTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/4yjEJgAAA0gAAAAAVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/4yjEfAAAA0gAAAAAVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/4yjEfAAAA0gAAAAAVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/4yjEfAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';

type VoiceResponse = {
  conversationId: string;
  userTranscript: string;
  replyText: string;
  messageId: string;
};

async function main() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  if (error || !data.session?.access_token) {
    throw new Error(`Supabase login failed: ${error?.message ?? 'No session returned'}`);
  }

  const form = new FormData();
  form.append('file', new Blob([Buffer.from(SAMPLE_MP3_BASE64, 'base64')], { type: 'audio/mpeg' }), 'hello-mia.mp3');

  const response = await fetch(`${API_BASE_URL}/api/chat/voice`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${data.session.access_token}` },
    body: form,
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`POST /api/chat/voice failed (${response.status}): ${body}`);
  }

  const payload = JSON.parse(body) as VoiceResponse;

  if (!payload.conversationId || !payload.userTranscript || !payload.replyText || !payload.messageId) {
    throw new Error(`Unexpected voice response: ${body}`);
  }

  console.log('✅ Audio input with written reply smoke test passed');
  console.log('conversationId:', payload.conversationId);
  console.log('userTranscript:', payload.userTranscript);
  console.log('replyText:', payload.replyText);
  console.log('messageId:', payload.messageId);
}

main().catch((error) => {
  console.error('❌ Voice chat smoke test failed');
  console.error(error);
  process.exit(1);
});

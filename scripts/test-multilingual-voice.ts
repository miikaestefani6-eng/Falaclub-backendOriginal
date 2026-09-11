import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const API_BASE_URL = (
  process.env.RENDER_API_URL ??
  process.env.API_BASE_URL ??
  'https://falaclub-backend-staging.onrender.com'
).replace(/\/$/, '');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error(
    'Missing SUPABASE_URL, SUPABASE_ANON_KEY, TEST_USER_EMAIL or TEST_USER_PASSWORD.',
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type LanguageCode = 'en' | 'es' | 'fr' | 'pt';

type LanguageCase = {
  code: LanguageCode;
  label: string;
  phrase: string;
  transcriptKeywords: string[];
  replyMarkers: string[];
};

type VoiceResponse = {
  conversationId: string;
  userTranscript: string;
  replyText: string;
  messageId: string;
};

const CASES: LanguageCase[] = [
  {
    code: 'en',
    label: 'English',
    phrase: 'Hello Mia! How are you doing today?',
    transcriptKeywords: ['hello', 'mia', 'how', 'today'],
    replyMarkers: [' i ', ' you ', ' your ', ' today ', ' doing ', ' good ', ' great ', ' how ', ' hello '],
  },
  {
    code: 'es',
    label: 'Español',
    phrase: '¡Hola Mia! ¿Cómo estás hoy?',
    transcriptKeywords: ['hola', 'mia', 'como', 'hoy'],
    replyMarkers: [' hola ', ' estoy ', ' estas ', ' hoy ', ' bien ', ' gracias ', ' que ', ' tu ', ' como '],
  },
  {
    code: 'fr',
    label: 'Français',
    phrase: "Bonjour Mia ! Comment vas-tu aujourd'hui ?",
    transcriptKeywords: ['bonjour', 'mia', 'comment', 'aujourd'],
    replyMarkers: [' bonjour ', ' je ', ' tu ', ' vous ', ' bien ', ' merci ', ' comment ', ' aujourd ', ' ca '],
  },
  {
    code: 'pt',
    label: 'Português',
    phrase: 'Olá Mia! Como você está hoje?',
    transcriptKeywords: ['ola', 'mia', 'como', 'hoje'],
    replyMarkers: [' ola ', ' estou ', ' voce ', ' hoje ', ' bem ', ' como ', ' eu ', ' tudo ', ' que '],
  },
];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function assertTranscript(language: LanguageCase, transcript: string) {
  const normalized = normalize(transcript);
  const matched = language.transcriptKeywords.filter((keyword) => normalized.includes(keyword));

  if (matched.length < Math.ceil(language.transcriptKeywords.length * 0.75)) {
    throw new Error(
      `[${language.code.toUpperCase()}] Transcript mismatch. Expected phrase: "${language.phrase}"; received: "${transcript}"; matched keywords: ${matched.join(', ') || 'none'}`,
    );
  }
}

function languageScore(text: string, markers: string[]) {
  const padded = ` ${normalize(text)} `;
  return markers.reduce((score, marker) => score + (padded.includes(marker) ? 1 : 0), 0);
}

function assertReplyLanguage(language: LanguageCase, replyText: string) {
  const scores = Object.fromEntries(
    CASES.map((candidate) => [candidate.code, languageScore(replyText, candidate.replyMarkers)]),
  ) as Record<LanguageCode, number>;

  const expectedScore = scores[language.code];
  const highestOther = Math.max(
    ...CASES.filter((candidate) => candidate.code !== language.code).map(
      (candidate) => scores[candidate.code],
    ),
  );

  if (expectedScore < 1 || expectedScore < highestOther) {
    throw new Error(
      `[${language.code.toUpperCase()}] Mia replied in an unexpected language. Scores=${JSON.stringify(scores)} reply="${replyText}"`,
    );
  }
}

function createLocalSpeechFixture(language: LanguageCase) {
  const voices: Record<LanguageCode, string> = { en: 'en-us', es: 'es', fr: 'fr-fr', pt: 'pt-br' };
  const directory = mkdtempSync(join(tmpdir(), 'falaclub-voice-'));
  const outputPath = join(directory, `${language.code}.wav`);
  try {
    execFileSync('espeak', ['-v', voices[language.code], '-w', outputPath, language.phrase]);
    return readFileSync(outputPath);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

async function testLanguage(language: LanguageCase, accessToken: string) {
  console.log(`\n▶ Testing ${language.label} (${language.code.toUpperCase()})`);
  console.log(`Input: ${language.phrase}`);

  const inputAudio = createLocalSpeechFixture(language);
  const form = new FormData();
  form.append(
    'file',
    new Blob([inputAudio], { type: 'audio/wav' }),
    `input-${language.code}.wav`,
  );

  const response = await fetch(`${API_BASE_URL}/api/chat/voice`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(
      `[${language.code.toUpperCase()}] POST /api/chat/voice failed (${response.status}): ${body}`,
    );
  }

  const payload = JSON.parse(body) as VoiceResponse;

  if (
    !payload.conversationId ||
    !payload.userTranscript ||
    !payload.replyText ||
    !payload.messageId
  ) {
    throw new Error(`[${language.code.toUpperCase()}] Unexpected response: ${body}`);
  }

  assertTranscript(language, payload.userTranscript);
  assertReplyLanguage(language, payload.replyText);

  console.log(`✅ ${language.code.toUpperCase()} passed`);
  console.log(`   userTranscript: ${payload.userTranscript}`);
  console.log(`   replyText: ${payload.replyText}`);
  console.log(`   conversationId: ${payload.conversationId}`);
}

async function main() {
  console.log(`FalaClub multilingual voice E2E → ${API_BASE_URL}`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  if (error || !data.session?.access_token) {
    throw new Error(`Supabase login failed: ${error?.message ?? 'No session returned'}`);
  }

  for (const language of CASES) {
    await testLanguage(language, data.session.access_token);
  }

  console.log('\n✅ ALL 4 LANGUAGES PASSED E2E VOICE TEST');
}

main().catch((error) => {
  console.error('\n❌ MULTILINGUAL E2E VOICE TEST FAILED');
  console.error(error);
  process.exit(1);
});

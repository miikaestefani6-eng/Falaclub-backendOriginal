import { supabase } from "@/lib/supabase";

const API_URL = (import.meta.env['VITE_MIA_API_URL'] || "https://falaclub-backend-oficial.onrender.com").replace(/\/$/, "");

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error("Sua sessão expirou. Faça login novamente.");
  return data.session.access_token;
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof data === "object" && data?.error ? data.error : "Não foi possível falar com a Mia agora.";
    throw new Error(message);
  }
  return data;
}

export async function sendMiaMessage(message: string, conversationId?: string | null) {
  const token = await getAccessToken();
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message, ...(conversationId ? { conversationId } : {}) }),
  });
  return parseResponse(response) as Promise<{ conversationId: string; reply: string; messageId: string }>;
}

export async function sendMiaVoice(audio: Blob, conversationId?: string | null) {
  const token = await getAccessToken();
  const formData = new FormData();
  formData.append("file", audio, audio.type.includes("ogg") ? "voz-aluno.ogg" : audio.type.includes("mp4") ? "voz-aluno.mp4" : "voz-aluno.webm");
  if (conversationId) formData.append("conversationId", conversationId);
  const response = await fetch(`${API_URL}/api/chat/voice`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return parseResponse(response) as Promise<{
    conversationId: string;
    userTranscript: string;
    replyText: string;
    messageId: string;
  }>;
}

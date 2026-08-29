import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Send, Square, Volume2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MiaAvatar } from "@/components/brand";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { concederXP } from "@/lib/gamification";
import { sendMiaMessage, sendMiaVoice } from "@/lib/mia-api";

export const Route = createFileRoute("/mia")({
  head: () => ({ meta: [{ title: "Falar com a Mia — FalaClub" }, { name: "description", content: "Converse com a Mia, sua professora de idiomas com IA, e treine fala e escuta." }] }),
  component: MiaChat,
});

type ChatMessage = { de: "aluno" | "mia"; texto: string; audio?: string | null };
type PerfilAluno = { full_name?: string; target_language?: string; level?: string; goal?: string; daily_minutes?: number; interests?: string[]; xp_total?: number; streak_count?: number; recent_activities?: Array<{ activity_type?: string; skill?: string; language?: string; level?: string; minutes?: number; xp_earned?: number; completed_at?: string; metadata?: Record<string, unknown> | null }> };

function MiaChat() {
  const navigate = useNavigate();
  const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [perfilAluno, setPerfilAluno] = useState<PerfilAluno>({});
  const [isRecording, setIsRecording] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    async function carregarChat() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/login" }); return; }
      const [{ data: profile }, { data: conversation }] = await Promise.all([
        supabase.from("mia_student_context").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("conversations").select("id").eq("user_id", user.id).eq("channel", "app").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (profile) setPerfilAluno(profile as PerfilAluno);
      if (conversation?.id) {
        setConversationId(conversation.id);
        const { data: history } = await supabase.from("messages").select("sender, content").eq("conversation_id", conversation.id).order("created_at", { ascending: true }).limit(50);
        if (history?.length) setMensagens(history.filter((item) => item.sender === "user" || item.sender === "assistant").map((item) => ({ de: item.sender === "user" ? "aluno" : "mia", texto: item.content })));
      }
    }
    carregarChat().catch((error) => console.error("Erro ao carregar chat da Mia:", error));
  }, [navigate]);

  function tocarAudio(audioData: string) {
    const src = audioData.startsWith("http") ? audioData : `data:audio/mpeg;base64,${audioData}`;
    const audio = new Audio(src);
    audio.play().catch((error) => console.error("Erro ao reproduzir áudio da Mia:", error));
  }

  async function enviar(valor: string) {
    const conteudo = valor.trim(); if (!conteudo || loading) return;
    setErro(null); setTexto(""); setMensagens((m) => [...m, { de: "aluno", texto: conteudo }]); setLoading(true);
    try {
      const result = await sendMiaMessage(conteudo, conversationId);
      setConversationId(result.conversationId);
      setMensagens((m) => [...m, { de: "mia", texto: result.reply, audio: result.audioBase64 }]);
      if (result.audioBase64) tocarAudio(result.audioBase64);
      else setErro("A Mia respondeu, mas a voz não foi gerada. Verifique o serviço de voz.");
      void concederXP(10);
    } catch (error) {
      console.error("Erro ao enviar mensagem para a Mia:", error);
      setErro(error instanceof Error ? error.message : "Não consegui falar com a Mia agora.");
      setMensagens((m) => [...m, { de: "mia", texto: "Tive um probleminha para responder agora. Tenta novamente em instantes? ☕" }]);
    } finally { setLoading(false); }
  }

  async function enviarAudioParaBackend(blob: Blob) {
    setErro(null); setLoading(true); setMensagens((m) => [...m, { de: "aluno", texto: "🎤 Processando seu áudio..." }]);
    try {
      const result = await sendMiaVoice(blob, conversationId);
      setConversationId(result.conversationId);
      setMensagens((m) => { const copia = [...m]; const ultimo = copia[copia.length - 1]; if (ultimo?.de === "aluno" && ultimo.texto === "🎤 Processando seu áudio...") copia[copia.length - 1] = { de: "aluno", texto: result.userTranscript }; return [...copia, { de: "mia", texto: result.replyText, audio: result.audioBase64 }]; });
      if (result.audioBase64) tocarAudio(result.audioBase64); else setErro("A Mia respondeu, mas a voz não foi gerada. Verifique o serviço de voz.");
      void concederXP(10);
    } catch (error) { console.error("Erro ao processar áudio:", error); setErro(error instanceof Error ? error.message : "Não consegui processar seu áudio agora."); setMensagens((m) => [...m, { de: "mia", texto: "Não consegui processar seu áudio. Pode tentar novamente? 🎙️" }]); }
    finally { setLoading(false); }
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setErro("Seu navegador não oferece gravação de áudio neste dispositivo."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeCandidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
      const mimeType = mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder; audioChunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      recorder.onstop = async () => { const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" }); stream.getTracks().forEach((track) => track.stop()); await enviarAudioParaBackend(blob); };
      recorder.start(); setIsRecording(true);
    } catch (error) { console.error("Erro ao acessar microfone:", error); setErro("Não consegui acessar seu microfone. Verifique a permissão do navegador."); }
  }

  function stopRecording() { if (mediaRecorderRef.current?.state === "recording") { mediaRecorderRef.current.stop(); setIsRecording(false); } }
  const sugestoes = perfilAluno.goal?.includes("Viajar") ? ["Treinar na imigração ✈️", "Pedir comida no restaurante 🍽️", "Perguntar direções 🗺️"] : perfilAluno.goal?.includes("Trabalho") ? ["Simular reunião 💼", "Apresentação pessoal 🤝", "Responder e-mail profissional 📧"] : ["Treinar conversa livre 🗣️", "Corrigir minha pronúncia 🎙️", "Aprender gírias do dia a dia ✨"];

  return <AppShell titulo="Falar com a Mia" subtitulo="Conversa guiada, correção gentil e zero julgamento"><div className="surface-card flex h-[calc(100vh-16rem)] min-h-[26rem] flex-col overflow-hidden p-0"><div className="flex items-center gap-3 border-b border-border bg-gradient-mia p-4 text-primary-foreground"><MiaAvatar className="ring-0" /><div><p className="text-sm font-bold">Mia</p><p className="text-xs opacity-85">{isRecording ? "Gravando sua voz... 🎙️" : loading ? "Mia está processando... ☕" : perfilAluno.target_language ? `online · praticando ${perfilAluno.target_language} (${perfilAluno.level || "A1"})` : "online · praticando com você"}</p></div></div>{erro && <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-500">{erro}</div>}<div className="flex-1 space-y-3 overflow-y-auto p-4">{mensagens.length === 0 && !loading ? <div className="flex h-full items-center justify-center p-6 text-center"><div className="max-w-md"><MiaAvatar className="mx-auto size-14 ring-0" /><p className="mt-3 font-display text-lg font-bold">Quando quiser, pode começar. ☕</p><p className="mt-1 text-sm text-muted-foreground">Escreva uma mensagem ou escolha uma prática abaixo. A conversa será carregada e salva no seu histórico real.</p></div></div> : mensagens.map((m, i) => <div key={`${i}-${m.texto}`} className={cn("flex gap-2", m.de === "aluno" ? "justify-end" : "justify-start")}>{m.de === "mia" ? <MiaAvatar className="size-8 ring-0" /> : null}<div className="flex max-w-[80%] flex-col gap-1"><p className={cn("text-sm leading-relaxed", m.de === "aluno" ? "rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground" : "rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-foreground")}>{m.texto}</p>{m.audio ? <button onClick={() => tocarAudio(m.audio!)} className="flex self-start items-center gap-1 px-1 text-xs text-muted-foreground hover:text-primary"><Volume2 className="size-3" /> Ouvir novamente</button> : null}</div></div>)}{loading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><MiaAvatar className="size-6 ring-0" /><span className="flex items-center gap-1">Mia está pensando... <Loader2 className="size-3 animate-spin" /></span></div>}</div><div className="border-t border-border p-3"><div className="mb-2 flex flex-wrap gap-2">{sugestoes.map((s) => <button key={s} disabled={loading || isRecording} onClick={() => void enviar(s)} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground disabled:opacity-50">{s}</button>)}</div><form onSubmit={(e) => { e.preventDefault(); void enviar(texto); }} className="flex items-center gap-2"><input value={texto} disabled={loading || isRecording} onChange={(e) => setTexto(e.target.value)} placeholder={isRecording ? "Gravando áudio..." : "Escreva ou fale com a Mia..."} className="h-11 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-primary disabled:opacity-50" /><button type="button" aria-label={isRecording ? "Parar gravação" : "Falar"} disabled={loading} onClick={isRecording ? stopRecording : startRecording} className={cn("flex size-11 items-center justify-center rounded-full border transition-colors", isRecording ? "animate-pulse border-red-600 bg-red-500 text-white" : "border-input text-muted-foreground hover:text-primary")}>{isRecording ? <Square className="size-4 fill-white" /> : <Mic className="size-4" />}</button><button type="submit" aria-label="Enviar" disabled={loading || !texto.trim() || isRecording} className="flex size-11 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground disabled:opacity-50">{loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</button></form></div></div></AppShell>;
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Headphones, Layers, MessageCircleHeart, Sparkles } from "lucide-react";
import { Logo, MiaFull } from "@/components/brand";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "FalaClub — Aprenda, pratique, fale com a Mia" }, { name: "description", content: "Seu clube de conversa, café e fluência. Pratique idiomas todos os dias com a Mia." }] }),
  component: Landing,
});

const pilares = [
  { icone: MessageCircleHeart, emoji: "💬", titulo: "Conversa de verdade", texto: "A Mia puxa assunto, corrige com carinho e nunca deixa você travar." },
  { icone: Layers, emoji: "🧠", titulo: "Flashcards que grudam", texto: "Repetição espaçada com áudio para o vocabulário virar reflexo." },
  { icone: Headphones, emoji: "🎧", titulo: "Biblioteca viva", texto: "Podcasts, músicas, vídeos, apostilas e aulas filtrados por nível." },
  { icone: Sparkles, emoji: "✨", titulo: "Drops diários", texto: "Uma dose de cultura, pronúncia e expressões todo santo dia." },
];

const perfis = [
  { nome: "Aluno", texto: "Plano do dia montado pela Mia, XP, sequência e certificados." },
  { nome: "Creator", texto: "Código e link exclusivos, conversões e comissões em tempo real." },
  { nome: "Escola", texto: "Licenças, turmas, apostilas e acompanhamento pedagógico." },
  { nome: "Professor", texto: "Turmas próprias, progresso dos alunos e gestão de licenças." },
];

const planos = [
  { nome: "Básico", preco: "25,00", descricao: "Para começar sua jornada com a Mia.", recursos: ["Acesso à plataforma", "Mia na plataforma", "Plano de estudos personalizado", "Práticas e atividades", "Acompanhamento da evolução"] },
  { nome: "Imersão", preco: "39,90", descricao: "Para colocar o idioma de verdade na sua rotina.", destaque: true, recursos: ["Tudo do plano Básico", "Mia pelo WhatsApp", "Prática fora da plataforma", "Mais oportunidades de conversação"] },
  { nome: "Fluência", preco: "59,90", descricao: "Para quem quer se desafiar e ganhar confiança na fala.", recursos: ["Tudo do plano Imersão", "Ligações com a Mia", "1 conversa por semana", "6 minutos por ligação", "Prática de conversação por voz"] },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6"><Logo /><Link to="/login" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">Já sou aluno</Link></header>
      <main>
        <section className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-14 pt-6 text-center sm:px-6 lg:pt-10"><span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Aprenda • Pratique • Fale</span><h1 className="mt-5 max-w-4xl font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">Seu clube de <span className="text-gradient-brand">conversa, café</span> e fluência.</h1><p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">A Mia é professora, mentora e parceira de estudos. Ela monta seu plano, conversa com você todos os dias e transforma prática em confiança para falar de verdade.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">Começar com a Mia <ArrowRight className="size-4" /></Link><Link to="/mia" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold">Conhecer a Mia</Link></div><div className="relative mt-8"><div className="absolute inset-6 rounded-[3rem] bg-gradient-brand opacity-20 blur-3xl" /><MiaFull className="relative mx-auto rounded-3xl border border-border bg-card p-5 shadow-sm" /></div><p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Mia — Embaixadora do FalaClub ❤️</p></section>
        <section className="bg-gradient-ink py-14 text-ink-foreground"><div className="mx-auto max-w-6xl px-4 sm:px-6"><h2 className="font-display text-2xl font-bold sm:text-3xl">Seis habilidades, uma rotina só</h2><p className="mt-2 max-w-xl text-sm opacity-80">Fala, escuta, compreensão, vocabulário, leitura e escrita evoluem juntos — do jeito que a comunicação real acontece.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{pilares.map((p) => <div key={p.titulo} className="rounded-2xl bg-card/10 p-5 backdrop-blur"><p className="text-2xl">{p.emoji}</p><h3 className="mt-4 text-base font-bold">{p.titulo}</h3><p className="mt-1 text-sm opacity-80">{p.texto}</p></div>)}</div></div></section>
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" id="planos"><div className="text-center"><span className="text-xs font-bold uppercase tracking-[0.16em] text-primary">ESCOLHA SEU CAMINHO</span><h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Comece no seu ritmo. Evolua no seu tempo.</h2><p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">Você começa, entra em imersão e, quando estiver pronto, busca a fluência.</p></div><div className="mt-10 grid gap-5 lg:grid-cols-3">{planos.map((plano) => <article key={plano.nome} className={`relative flex flex-col rounded-3xl border bg-card p-6 shadow-sm ${plano.destaque ? "border-primary shadow-glow" : "border-border"}`}>{plano.destaque && <span className="absolute -top-3 right-5 rounded-full bg-gradient-brand px-3 py-1 text-[10px] font-extrabold text-primary-foreground">MAIS ESCOLHIDO</span>}<h3 className="font-display text-xl font-bold">{plano.nome}</h3><p className="mt-2 min-h-10 text-sm text-muted-foreground">{plano.descricao}</p><p className="mt-5 font-display text-4xl font-extrabold">R$ {plano.preco}<span className="text-sm font-medium text-muted-foreground">/mês</span></p><ul className="mt-6 flex-1 space-y-3">{plano.recursos.map((recurso) => <li key={recurso} className="flex gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{recurso}</li>)}</ul><Link to="/login" className={`mt-7 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold ${plano.destaque ? "bg-gradient-brand text-primary-foreground" : "border border-border bg-secondary"}`}>Começar no {plano.nome}<ArrowRight className="ml-2 size-4" /></Link></article>)}</div></section>
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6"><h2 className="font-display text-2xl font-bold sm:text-3xl">Uma plataforma, vários perfis</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{perfis.map((perfil) => <article key={perfil.nome} className="surface-card p-5"><h3 className="font-display text-lg font-bold">{perfil.nome}</h3><p className="mt-2 text-sm text-muted-foreground">{perfil.texto}</p></article>)}</div></section>
      </main>
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">FalaClub — seu clube de conversa, café e fluência.</footer>
    </div>
  );
}

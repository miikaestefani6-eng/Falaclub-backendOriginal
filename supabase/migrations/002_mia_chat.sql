-- FalaClub: alinhar o modulo da Mia ao schema de chat ja existente.
-- As tabelas public.conversations e public.messages ja existem no projeto.
-- Esta migration apenas adiciona garantias e indices idempotentes necessarios ao modulo.

create index if not exists conversations_user_id_created_at_idx
  on public.conversations (user_id, created_at desc);

create index if not exists messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_sender_check'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_sender_check
      check (sender in ('user', 'assistant'));
  end if;
end
$$;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- RLS ja existe no projeto para:
-- 1. o usuario acessar apenas as proprias conversations;
-- 2. o usuario ler mensagens apenas das proprias conversations;
-- 3. o usuario inserir somente mensagens com sender = 'user'.
-- As respostas sender = 'assistant' sao gravadas exclusivamente pelo backend
-- usando SUPABASE_SERVICE_ROLE_KEY, que nao e exposta ao cliente.

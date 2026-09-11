# FalaClub Backend

Backend oficial do FalaClub.

API responsável pelo núcleo de serviços do aplicativo, incluindo autenticação via Supabase, perfil do usuário, progresso de aprendizagem e futuras integrações da Mia.

## Stack inicial

- Node.js
- TypeScript
- Express
- Supabase
- Zod

## Desenvolvimento

1. Copie `.env.example` para `.env`.
2. Preencha apenas as variáveis locais necessárias.
3. Instale as dependências com `npm install`.
4. Execute `npm run dev`.

> Nunca envie `.env`, chaves privadas ou tokens para o GitHub.

## Estrutura canônica

Este repositório reúne a API, o frontend em `frontend/` e as migrations do
Supabase. A branch `main` é a fonte de verdade do FalaClub.

Na plataforma, o aluno pode enviar texto ou áudio, e a Mia sempre responde por
escrito. Respostas em áudio da Mia pertencem exclusivamente ao canal WhatsApp.

## Verificações locais

Backend:

```bash
npm ci
npm run typecheck
npm run build
```

Frontend:

```bash
cd frontend
cp .env.example .env
npm ci
npm run lint
npm run build
```

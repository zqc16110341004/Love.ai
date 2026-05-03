-- Run this in your Neon SQL editor to set up the schema

-- ── users ────────────────────────────────────────────────────────────────────
-- NextAuth manages sessions; we store minimal user info for FK references.
create table if not exists users (
  id           text primary key,              -- NextAuth user ID
  name         text,
  email        text unique,
  image        text,
  created_at   timestamptz not null default now()
);

-- ── memories ────────────────────────────────────────────────────────────────
-- One row per (user, character) pair. Stores a free-text summary that gets
-- injected into the system prompt at the start of every conversation.
create table if not exists memories (
  id           serial primary key,
  user_id      text not null references users(id) on delete cascade,
  character_id text not null,
  summary      text not null default '',
  updated_at   timestamptz not null default now(),
  unique(user_id, character_id)
);

-- ── messages ─────────────────────────────────────────────────────────────────
-- Persistent chat history for logged-in users.
create table if not exists messages (
  id           serial primary key,
  user_id      text not null references users(id) on delete cascade,
  character_id text not null,
  role         text not null check (role in ('user', 'assistant')),
  content      text not null,
  created_at   timestamptz not null default now()
);

create index if not exists messages_user_character_time
  on messages (user_id, character_id, created_at);

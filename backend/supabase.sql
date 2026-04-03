-- ═══════════════════════════════════════════════════════════════
-- SEVERUS — Universal Learning Engine
-- Supabase / Postgres Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- SUBJECTS
-- One row per supported subject (history, science, econ, law)
-- ─────────────────────────────────────────────────────────────
create table if not exists subjects (
  id            text primary key,             -- e.g. "history", "science"
  label         text not null,                -- "History"
  tools         text[] default '{}',          -- ["web_search","wikipedia"]
  visualizer    text default 'none',          -- "historical_image" | "diagram" | "none"
  narrator_style text default 'documentary', -- "documentary" | "analytical" | "step_by_step" | "clinical"
  created_at    timestamptz default now()
);

insert into subjects (id, label, tools, visualizer, narrator_style) values
  ('history', 'History',   array['web_search','wikipedia','slavevoyages'], 'historical_image', 'documentary'),
  ('science', 'Science',   array['web_search','wikipedia'],                'diagram',          'process_explanation'),
  ('econ',    'Economics', array['web_search','wikipedia'],                'none',             'analytical'),
  ('law',     'Law',       array['web_search','wikipedia'],                'none',             'analytical')
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- CONCEPTS
-- Universal knowledge graph nodes — works for any subject
-- ─────────────────────────────────────────────────────────────
create table if not exists concepts (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null,          -- e.g. "roman-empire", "photosynthesis"
  label         text not null,                 -- display name
  subject_id    text references subjects(id),
  type          text not null default 'concept', -- person | event | place | institution | process | concept
  summary       text,
  key_facts     text[] default '{}',
  difficulty    int default 2 check (difficulty between 1 and 5),
  era           text,                          -- e.g. "27 BCE – 476 CE"
  region        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists concepts_subject_idx on concepts(subject_id);
create index if not exists concepts_slug_idx on concepts(slug);

-- ─────────────────────────────────────────────────────────────
-- CONCEPT EDGES
-- Relationships between concepts
-- ─────────────────────────────────────────────────────────────
create table if not exists concept_edges (
  id            uuid primary key default uuid_generate_v4(),
  from_concept  uuid references concepts(id) on delete cascade,
  to_concept    uuid references concepts(id) on delete cascade,
  label         text not null,                -- "Led by", "Traded with", "Caused"
  strength      float default 0.8 check (strength between 0 and 1),
  created_at    timestamptz default now(),
  unique(from_concept, to_concept, label)
);

create index if not exists edges_from_idx on concept_edges(from_concept);
create index if not exists edges_to_idx on concept_edges(to_concept);

-- ─────────────────────────────────────────────────────────────
-- CONCEPT PREREQUISITES
-- What a student needs to understand before studying this concept
-- ─────────────────────────────────────────────────────────────
create table if not exists concept_prerequisites (
  concept_id    uuid references concepts(id) on delete cascade,
  requires_id   uuid references concepts(id) on delete cascade,
  primary key (concept_id, requires_id)
);

-- ─────────────────────────────────────────────────────────────
-- INSTITUTIONS
-- Schools, universities, any organisation using Severus
-- ─────────────────────────────────────────────────────────────
create table if not exists institutions (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  subjects_enabled text[] default '{"history"}',
  created_at       timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- USERS
-- Extends Supabase auth.users with learner profile
-- ─────────────────────────────────────────────────────────────
create table if not exists users (
  id               uuid primary key references auth.users(id) on delete cascade,
  display_name     text,
  institution_id   uuid references institutions(id),
  role             text default 'student' check (role in ('student','teacher','admin')),
  subjects_active  text[] default '{"history"}',
  created_at       timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- SESSIONS
-- Every research session a user runs
-- ─────────────────────────────────────────────────────────────
create table if not exists sessions (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references users(id) on delete cascade,
  question          text not null,
  subject_id        text references subjects(id),
  question_type     text,                      -- causal | conceptual | biographical | process
  depth             text default 'teaser',     -- teaser | deep_dive
  historian_output  text,
  investigator_output text,
  guide_narrative   text,
  pi_board          jsonb,                     -- {nodes:[...], edges:[...]}
  has_image         boolean default false,
  duration_ms       int,
  created_at        timestamptz default now()
);

create index if not exists sessions_user_idx on sessions(user_id);
create index if not exists sessions_subject_idx on sessions(subject_id);
create index if not exists sessions_created_idx on sessions(created_at desc);

-- ─────────────────────────────────────────────────────────────
-- SESSION CONCEPTS
-- Which concepts appeared in a session (many-to-many)
-- ─────────────────────────────────────────────────────────────
create table if not exists session_concepts (
  session_id    uuid references sessions(id) on delete cascade,
  concept_slug  text not null,                -- slug or free-text if not in KB
  concept_label text not null,
  primary key (session_id, concept_slug)
);

create index if not exists sc_session_idx on session_concepts(session_id);
create index if not exists sc_slug_idx on session_concepts(concept_slug);

-- ─────────────────────────────────────────────────────────────
-- LEARNER CONCEPTS
-- Running confidence score per concept per user
-- Updated after each session
-- ─────────────────────────────────────────────────────────────
create table if not exists learner_concepts (
  user_id        uuid references users(id) on delete cascade,
  concept_slug   text not null,
  concept_label  text not null,
  subject_id     text references subjects(id),
  encounters     int default 1,
  confidence     float default 0.3 check (confidence between 0 and 1),
  last_seen      timestamptz default now(),
  primary key (user_id, concept_slug)
);

create index if not exists lc_user_idx on learner_concepts(user_id);
create index if not exists lc_subject_idx on learner_concepts(subject_id);

-- ─────────────────────────────────────────────────────────────
-- CURRICULA
-- Institution-specific concept sequences
-- ─────────────────────────────────────────────────────────────
create table if not exists curricula (
  id               uuid primary key default uuid_generate_v4(),
  institution_id   uuid references institutions(id) on delete cascade,
  subject_id       text references subjects(id),
  title            text not null,
  concept_slugs    text[] default '{}',        -- ordered list of required concepts
  created_at       timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
alter table users              enable row level security;
alter table sessions           enable row level security;
alter table session_concepts   enable row level security;
alter table learner_concepts   enable row level security;

-- Users can only read/write their own data
create policy "users_own" on users
  for all using (auth.uid() = id);

create policy "sessions_own" on sessions
  for all using (auth.uid() = user_id);

create policy "session_concepts_own" on session_concepts
  for all using (
    session_id in (select id from sessions where user_id = auth.uid())
  );

create policy "learner_concepts_own" on learner_concepts
  for all using (auth.uid() = user_id);

-- Public read on concepts, subjects (shared knowledge)
alter table concepts           enable row level security;
alter table concept_edges      enable row level security;
alter table subjects           enable row level security;

create policy "concepts_public_read" on concepts
  for select using (true);

create policy "edges_public_read" on concept_edges
  for select using (true);

create policy "subjects_public_read" on subjects
  for select using (true);

-- ─────────────────────────────────────────────────────────────
-- FUNCTIONS
-- ─────────────────────────────────────────────────────────────

-- Upsert learner concept — called after each session
create or replace function upsert_learner_concept(
  p_user_id      uuid,
  p_slug         text,
  p_label        text,
  p_subject_id   text
) returns void language plpgsql as $$
begin
  insert into learner_concepts (user_id, concept_slug, concept_label, subject_id, encounters, confidence, last_seen)
  values (p_user_id, p_slug, p_label, p_subject_id, 1, 0.3, now())
  on conflict (user_id, concept_slug) do update
    set encounters  = learner_concepts.encounters + 1,
        confidence  = least(1.0, learner_concepts.confidence + 0.15),
        last_seen   = now();
end;
$$;

-- Get prior knowledge for a user — returns top concepts by confidence
create or replace function get_prior_knowledge(
  p_user_id    uuid,
  p_subject_id text default null,
  p_limit      int default 10
) returns table (
  concept_slug  text,
  concept_label text,
  confidence    float,
  encounters    int,
  last_seen     timestamptz
) language plpgsql as $$
begin
  return query
    select lc.concept_slug, lc.concept_label, lc.confidence, lc.encounters, lc.last_seen
    from learner_concepts lc
    where lc.user_id = p_user_id
      and (p_subject_id is null or lc.subject_id = p_subject_id)
    order by lc.confidence desc, lc.last_seen desc
    limit p_limit;
end;
$$;

-- Get related prior knowledge for a specific question
create or replace function get_relevant_prior_knowledge(
  p_user_id uuid,
  p_keywords text[]
) returns table (
  concept_slug  text,
  concept_label text,
  confidence    float,
  last_seen     timestamptz
) language plpgsql as $$
begin
  return query
    select lc.concept_slug, lc.concept_label, lc.confidence, lc.last_seen
    from learner_concepts lc
    where lc.user_id = p_user_id
      and (
        select count(*) from unnest(p_keywords) kw
        where lower(lc.concept_label) like '%' || lower(kw) || '%'
      ) > 0
    order by lc.confidence desc
    limit 8;
end;
$$;
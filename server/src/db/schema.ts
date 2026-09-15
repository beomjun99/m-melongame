export const schemaSql = `
create table if not exists users (
  id bigserial primary key,
  nickname varchar(40) not null unique,
  created_at timestamptz not null default now()
);

create table if not exists game_results (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  score integer not null check (score >= 0),
  max_level integer not null check (max_level between 1 and 11),
  level_11_count integer not null check (level_11_count >= 0),
  played_at timestamptz not null default now()
);

create index if not exists game_results_score_idx
  on game_results (score desc, played_at asc);

create index if not exists game_results_user_played_at_idx
  on game_results (user_id, played_at desc);

create table if not exists themes (
  id bigserial primary key,
  user_id bigint references users(id) on delete cascade,
  name varchar(80) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop index if exists themes_default_idx;

create table if not exists theme_items (
  id bigserial primary key,
  theme_id bigint not null references themes(id) on delete cascade,
  level integer not null check (level between 1 and 11),
  image_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (theme_id, level)
);

create table if not exists battle_results (
  id bigserial primary key,
  room_id varchar(20) not null,
  player1_nickname varchar(40) not null,
  player2_nickname varchar(40) not null,
  winner_nickname varchar(40) not null,
  player1_score integer not null check (player1_score >= 0),
  player2_score integer not null check (player2_score >= 0),
  started_at timestamptz not null,
  finished_at timestamptz not null default now()
);

create index if not exists battle_results_finished_at_idx
  on battle_results (finished_at desc);
`;

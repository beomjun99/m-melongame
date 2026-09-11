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
`;

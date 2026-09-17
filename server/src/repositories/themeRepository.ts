import { pool } from '../db/pool.js';

export type ThemeItemRecord = {
  level: number;
  imageUrl: string;
};

export type ThemeRecord = {
  id: string;
  name: string;
  fruits: ThemeItemRecord[];
};

const themeSelect = `
  select
    t.id::text,
    t.name,
    coalesce(
      json_agg(
        json_build_object(
          'level', ti.level,
          'imageUrl', ti.image_url
        )
        order by ti.level
      ) filter (where ti.id is not null),
      '[]'::json
    ) as fruits
  from themes t
  left join theme_items ti on ti.theme_id = t.id
`;

export async function listThemes() {
  const result = await pool.query<ThemeRecord>(`
    ${themeSelect}
    group by t.id
    order by t.updated_at desc, t.id desc
  `);

  return result.rows;
}

export async function getTheme(themeId: string) {
  const result = await pool.query<ThemeRecord>(
    `
      ${themeSelect}
      where t.id = $1
      group by t.id
    `,
    [themeId]
  );

  return result.rows[0] ?? null;
}

export async function ensureDefaultTheme() {
  const existingTheme = await pool.query<{ id: string }>(
    `
      select id::text
      from themes
      where user_id is null and name = 'Default Custom Theme'
      order by id asc
      limit 1
    `
  );

  if (existingTheme.rows[0]) {
    return existingTheme.rows[0].id;
  }

  const result = await pool.query<{ id: string }>(
    `
      insert into themes (name)
      values ('Default Custom Theme')
      returning id::text
    `
  );

  return result.rows[0].id;
}

export async function themeNameExists(name: string) {
  const result = await pool.query<{ exists: boolean }>(
    `
      select exists (
        select 1
        from themes
        where lower(name) = lower($1)
      )
    `,
    [name]
  );

  return result.rows[0]?.exists ?? false;
}

export async function createTheme(name: string) {
  const result = await pool.query<{ id: string }>(
    `
      insert into themes (name)
      values ($1)
      returning id::text
    `,
    [name]
  );

  return getTheme(result.rows[0].id);
}

export async function deleteTheme(themeId: string) {
  await pool.query('delete from themes where id = $1', [themeId]);
}

export async function upsertThemeImage(themeId: string, level: number, imageUrl: string) {
  await pool.query(
    `
      insert into theme_items (theme_id, level, image_url)
      values ($1, $2, $3)
      on conflict (theme_id, level)
      do update set image_url = excluded.image_url, updated_at = now()
    `,
    [themeId, level, imageUrl]
  );

  await pool.query('update themes set updated_at = now() where id = $1', [themeId]);

  return getTheme(themeId);
}

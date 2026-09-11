import { Router } from 'express';
import { pool } from '../db/pool.js';

export const rankingsRouter = Router();

rankingsRouter.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query(
      `
        select
          row_number() over (order by gr.score desc, gr.played_at asc, gr.id asc)::integer as rank,
          u.nickname,
          gr.score,
          gr.max_level as "maxLevel",
          gr.level_11_count as "level11Count",
          gr.played_at as "playedAt"
        from game_results gr
        join users u on u.id = gr.user_id
        order by gr.score desc, gr.played_at asc, gr.id asc
        limit 10
      `
    );

    res.json({
      rankings: result.rows
    });
  } catch (error) {
    next(error);
  }
});

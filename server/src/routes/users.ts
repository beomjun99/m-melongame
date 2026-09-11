import { Router } from 'express';
import { pool } from '../db/pool.js';

export const usersRouter = Router();

usersRouter.get('/:nickname/results', async (req, res, next) => {
  try {
    const nickname = req.params.nickname.trim();

    if (!nickname) {
      res.status(400).json({ error: 'nickname is required.' });
      return;
    }

    const result = await pool.query(
      `
        select
          gr.id,
          u.nickname,
          gr.score,
          gr.max_level as "maxLevel",
          gr.level_11_count as "level11Count",
          gr.played_at as "playedAt"
        from game_results gr
        join users u on u.id = gr.user_id
        where lower(u.nickname) = lower($1)
        order by gr.played_at desc
        limit 20
      `,
      [nickname]
    );

    res.json({
      results: result.rows
    });
  } catch (error) {
    next(error);
  }
});

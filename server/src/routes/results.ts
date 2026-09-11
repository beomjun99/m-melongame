import { Router } from 'express';
import { pool } from '../db/pool.js';

type ResultRequestBody = {
  nickname?: unknown;
  score?: unknown;
  maxLevel?: unknown;
  level11Count?: unknown;
};

function normalizeNickname(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const nickname = value.trim();

  if (nickname.length < 1 || nickname.length > 40) {
    return null;
  }

  return nickname;
}

function normalizeNonNegativeInteger(value: unknown) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return null;
  }

  return value;
}

function normalizeMaxLevel(value: unknown) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 11) {
    return null;
  }

  return value;
}

export const resultsRouter = Router();

resultsRouter.post('/', async (req, res, next) => {
  try {
    const body = req.body as ResultRequestBody;
    const nickname = normalizeNickname(body.nickname);
    const score = normalizeNonNegativeInteger(body.score);
    const maxLevel = normalizeMaxLevel(body.maxLevel);
    const level11Count = normalizeNonNegativeInteger(body.level11Count);

    if (!nickname || score === null || maxLevel === null || level11Count === null) {
      res.status(400).json({
        error: 'nickname, score, maxLevel, and level11Count are required.'
      });
      return;
    }

    const client = await pool.connect();

    try {
      await client.query('begin');

      const userResult = await client.query<{ id: string }>(
        `
          insert into users (nickname)
          values ($1)
          on conflict (nickname) do update set nickname = excluded.nickname
          returning id
        `,
        [nickname]
      );
      const userId = userResult.rows[0].id;

      const result = await client.query(
        `
          insert into game_results (user_id, score, max_level, level_11_count)
          values ($1, $2, $3, $4)
          returning id, score, max_level as "maxLevel", level_11_count as "level11Count", played_at as "playedAt"
        `,
        [userId, score, maxLevel, level11Count]
      );

      await client.query('commit');

      res.status(201).json({
        result: {
          ...result.rows[0],
          nickname
        }
      });
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

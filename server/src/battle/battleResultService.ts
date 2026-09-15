import { pool } from '../db/pool.js';
import type { BattlePlayer, BattleRoom } from './battleTypes.js';

export async function saveBattleResult(room: BattleRoom, winner: BattlePlayer) {
  const [player1, player2] = room.players;

  if (!player1 || !player2 || !room.startedAt || !room.finishedAt) {
    return null;
  }

  const result = await pool.query(
    `
      insert into battle_results (
        room_id,
        player1_nickname,
        player2_nickname,
        winner_nickname,
        player1_score,
        player2_score,
        started_at,
        finished_at
      )
      values ($1, $2, $3, $4, $5, $6, to_timestamp($7 / 1000.0), to_timestamp($8 / 1000.0))
      returning
        id::text,
        room_id as "roomId",
        player1_nickname as "player1Nickname",
        player2_nickname as "player2Nickname",
        winner_nickname as "winnerNickname",
        player1_score as "player1Score",
        player2_score as "player2Score",
        started_at as "startedAt",
        finished_at as "finishedAt"
    `,
    [
      room.roomId,
      player1.nickname,
      player2.nickname,
      winner.nickname,
      player1.score,
      player2.score,
      room.startedAt,
      room.finishedAt
    ]
  );

  return result.rows[0] ?? null;
}

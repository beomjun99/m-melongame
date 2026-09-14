import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from '../config/env.js';

export function initializeBattleSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigin
    }
  });

  const battleNamespace = io.of('/battle');

  battleNamespace.on('connection', (socket) => {
    console.log(`Battle socket connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`Battle socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

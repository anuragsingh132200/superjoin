import WebSocket from 'ws';
import { Server } from 'http';
import logger from '../utils/logger';

let wss: WebSocket.Server | null = null;
const clients = new Set<WebSocket>();

export function initWebSocket(server: Server): void {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    logger.info('New WebSocket connection established');
    clients.add(ws);

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        logger.info('Received WebSocket message:', data);

        broadcastSync(data);
      } catch (error) {
        logger.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      logger.info('WebSocket connection closed');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      clients.delete(ws);
    });

    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to sync server' }));
  });

  logger.info('WebSocket server initialized');
}

export function broadcastSync(data: any): void {
  const message = JSON.stringify(data);

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  logger.info(`Broadcast message to ${clients.size} clients`);
}

export function closeWebSocket(): void {
  if (wss) {
    clients.forEach((client) => {
      client.close();
    });
    wss.close();
    logger.info('WebSocket server closed');
  }
}

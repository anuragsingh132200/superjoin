import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config';
import { initDatabase, closeDatabase } from './database/connection';
import { initWebSocket, closeWebSocket } from './sync/websocket';
import { performSync, initializeSync } from './sync/sync-engine';
import apiRoutes from './api/routes';
import logger from './utils/logger';

const app = express();
const server = createServer(app);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.render('index', {
    sheetId: config.google.sheetId,
  });
});

let syncInterval: NodeJS.Timeout | null = null;

async function startServer() {
  try {
    logger.info('Starting Superjoin Sync Server...');

    await initDatabase();
    logger.info('Database initialized successfully');

    initWebSocket(server);
    logger.info('WebSocket server initialized');

    await initializeSync();
    logger.info('Sync engine initialized');

    await performSync();
    logger.info('Initial sync completed');

    syncInterval = setInterval(async () => {
      await performSync();
    }, config.app.syncInterval);
    logger.info(`Sync interval set to ${config.app.syncInterval}ms`);

    server.listen(config.app.port, () => {
      logger.info(`Server running on port ${config.app.port}`);
      logger.info(`Environment: ${config.app.nodeEnv}`);
      logger.info(`Open http://localhost:${config.app.port} to view the dashboard`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function stopServer() {
  logger.info('Shutting down server...');

  if (syncInterval) {
    clearInterval(syncInterval);
  }

  closeWebSocket();
  await closeDatabase();

  server.close(() => {
    logger.info('Server shut down successfully');
    process.exit(0);
  });
}

process.on('SIGTERM', stopServer);
process.on('SIGINT', stopServer);

startServer();

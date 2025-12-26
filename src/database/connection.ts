import mysql from 'mysql2/promise';
import { config } from '../config';
import logger from '../utils/logger';

let pool: mysql.Pool | null = null;

export async function initDatabase(): Promise<mysql.Pool> {
  try {
    pool = mysql.createPool({
      host: config.mysql.host,
      port: config.mysql.port,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const connection = await pool.getConnection();
    logger.info('Database connection established successfully');
    connection.release();

    return pool;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

export function getPool(): mysql.Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDatabase() first.');
  }
  return pool;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    logger.info('Database connection closed');
  }
}

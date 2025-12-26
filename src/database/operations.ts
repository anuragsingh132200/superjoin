import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getPool } from './connection';
import logger from '../utils/logger';

export interface SyncData {
  id?: number;
  row_id: string;
  name: string;
  email: string;
  age: number;
  city: string;
  last_modified?: Date;
  version?: number;
}

export interface SyncLog {
  id?: number;
  row_id: string;
  action: string;
  source: string;
  data: any;
  timestamp?: Date;
}

export async function getAllData(): Promise<SyncData[]> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM sync_data ORDER BY id ASC'
  );
  return rows as SyncData[];
}

export async function getDataByRowId(rowId: string): Promise<SyncData | null> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM sync_data WHERE row_id = ?',
    [rowId]
  );
  return rows.length > 0 ? (rows[0] as SyncData) : null;
}

export async function insertData(data: SyncData): Promise<number> {
  const pool = getPool();
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO sync_data (row_id, name, email, age, city, version) VALUES (?, ?, ?, ?, ?, 1)',
    [data.row_id, data.name, data.email, data.age, data.city]
  );
  logger.info(`Inserted row ${data.row_id} into database`);
  return result.insertId;
}

export async function updateData(data: SyncData): Promise<void> {
  const pool = getPool();
  await pool.query(
    'UPDATE sync_data SET name = ?, email = ?, age = ?, city = ?, version = version + 1 WHERE row_id = ?',
    [data.name, data.email, data.age, data.city, data.row_id]
  );
  logger.info(`Updated row ${data.row_id} in database`);
}

export async function deleteData(rowId: string): Promise<void> {
  const pool = getPool();
  await pool.query('DELETE FROM sync_data WHERE row_id = ?', [rowId]);
  logger.info(`Deleted row ${rowId} from database`);
}

export async function logSync(log: SyncLog): Promise<void> {
  const pool = getPool();
  await pool.query(
    'INSERT INTO sync_log (row_id, action, source, data) VALUES (?, ?, ?, ?)',
    [log.row_id, log.action, log.source, JSON.stringify(log.data)]
  );
}

export async function clearAllData(): Promise<void> {
  const pool = getPool();
  await pool.query('DELETE FROM sync_data');
  logger.info('Cleared all data from database');
}

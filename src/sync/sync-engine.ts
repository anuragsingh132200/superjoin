import { readSheetData, writeSheetData, initializeSheet } from '../google/sheets';
import {
  getAllData,
  getDataByRowId,
  insertData,
  updateData,
  deleteData,
  logSync,
  SyncData,
} from '../database/operations';
import logger from '../utils/logger';
import { broadcastSync } from './websocket';

interface SyncState {
  sheetData: Map<string, SyncData>;
  dbData: Map<string, SyncData>;
}

let lastSyncState: SyncState | null = null;
let isSyncing = false;

export async function performSync(): Promise<void> {
  if (isSyncing) {
    logger.warn('Sync already in progress, skipping...');
    return;
  }

  isSyncing = true;

  try {
    logger.info('Starting sync cycle...');

    const sheetRows = await readSheetData();
    const dbRows = await getAllData();

    const sheetData = new Map<string, SyncData>();
    sheetRows.forEach((row, index) => {
      row.row_id = `row_${index + 2}`;
      sheetData.set(row.row_id, row);
    });

    const dbData = new Map<string, SyncData>();
    dbRows.forEach(row => {
      dbData.set(row.row_id, row);
    });

    const currentState: SyncState = { sheetData, dbData };

    if (!lastSyncState) {
      await initialSync(currentState);
    } else {
      await incrementalSync(lastSyncState, currentState);
    }

    lastSyncState = currentState;
    logger.info('Sync cycle completed successfully');
  } catch (error) {
    logger.error('Error during sync:', error);
  } finally {
    isSyncing = false;
  }
}

async function initialSync(state: SyncState): Promise<void> {
  logger.info('Performing initial sync...');

  if (state.sheetData.size === 0 && state.dbData.size === 0) {
    logger.info('Both sources are empty, no initial sync needed');
    return;
  }

  if (state.dbData.size === 0) {
    for (const [rowId, data] of state.sheetData) {
      await insertData(data);
      await logSync({ row_id: rowId, action: 'INSERT', source: 'SHEET', data });
    }
    logger.info(`Initial sync: Imported ${state.sheetData.size} rows from sheet to database`);
  } else if (state.sheetData.size === 0) {
    const dataArray = Array.from(state.dbData.values());
    await writeSheetData(dataArray);
    logger.info(`Initial sync: Exported ${state.dbData.size} rows from database to sheet`);
  } else {
    logger.info('Both sources have data, using database as source of truth');
    const dataArray = Array.from(state.dbData.values());
    await writeSheetData(dataArray);
  }
}

async function incrementalSync(oldState: SyncState, newState: SyncState): Promise<void> {
  const changes: Array<{ type: string; rowId: string; data: any }> = [];

  for (const [rowId, newSheetData] of newState.sheetData) {
    const oldSheetData = oldState.sheetData.get(rowId);
    const oldDbData = oldState.dbData.get(rowId);
    const newDbData = newState.dbData.get(rowId);

    if (!oldSheetData && !newDbData) {
      await insertData(newSheetData);
      await logSync({ row_id: rowId, action: 'INSERT', source: 'SHEET', data: newSheetData });
      changes.push({ type: 'INSERT', rowId, data: newSheetData });
      logger.info(`Detected new row in sheet: ${rowId}`);
    } else if (oldSheetData && !dataEquals(oldSheetData, newSheetData)) {
      if (newDbData && !dataEquals(oldDbData!, newDbData)) {
        logger.warn(`Conflict detected for ${rowId}, using last-write-wins (database wins)`);
        const rowIndex = parseInt(rowId.split('_')[1]);
        await updateSheetRow(rowIndex, newDbData);
        changes.push({ type: 'CONFLICT_RESOLVED', rowId, data: newDbData });
      } else {
        if (newDbData) {
          await updateData(newSheetData);
        } else {
          await insertData(newSheetData);
        }
        await logSync({ row_id: rowId, action: 'UPDATE', source: 'SHEET', data: newSheetData });
        changes.push({ type: 'UPDATE', rowId, data: newSheetData });
        logger.info(`Detected update in sheet: ${rowId}`);
      }
    }
  }

  for (const [rowId, newDbData] of newState.dbData) {
    const oldDbData = oldState.dbData.get(rowId);
    const newSheetData = newState.sheetData.get(rowId);

    if (!oldDbData) {
      if (!newSheetData) {
        const { appendSheetRow } = await import('../google/sheets');
        await appendSheetRow(newDbData);
        await logSync({ row_id: rowId, action: 'INSERT', source: 'DATABASE', data: newDbData });
        changes.push({ type: 'INSERT', rowId, data: newDbData });
        logger.info(`Detected new row in database, synced to sheet: ${rowId}`);
      }
      continue;
    }

    if (!dataEquals(oldDbData, newDbData)) {
      if (!newSheetData || dataEquals(oldState.sheetData.get(rowId)!, newSheetData)) {
        const rowIndex = parseInt(rowId.split('_')[1]);
        const currentSheetRows = await readSheetData();
        const sheetIndex = currentSheetRows.findIndex(r => r.row_id === rowId);

        if (sheetIndex !== -1) {
          await updateSheetRow(sheetIndex + 2, newDbData);
          await logSync({ row_id: rowId, action: 'UPDATE', source: 'DATABASE', data: newDbData });
          changes.push({ type: 'UPDATE', rowId, data: newDbData });
          logger.info(`Synced database update to sheet: ${rowId}`);
        }
      }
    }
  }

  for (const [rowId] of oldState.dbData) {
    if (!newState.dbData.has(rowId) && newState.sheetData.has(rowId)) {
      const sheetRows = await readSheetData();
      const updatedRows = sheetRows.filter(r => r.row_id !== rowId);
      await writeSheetData(updatedRows);
      await logSync({ row_id: rowId, action: 'DELETE', source: 'DATABASE', data: {} });
      changes.push({ type: 'DELETE', rowId, data: {} });
      logger.info(`Row deleted from database, synced to sheet: ${rowId}`);
    }
  }

  for (const [rowId] of oldState.sheetData) {
    if (!newState.sheetData.has(rowId) && newState.dbData.has(rowId)) {
      await deleteData(rowId);
      await logSync({ row_id: rowId, action: 'DELETE', source: 'SHEET', data: {} });
      changes.push({ type: 'DELETE', rowId, data: {} });
      logger.info(`Row deleted from sheet, synced to database: ${rowId}`);
    }
  }

  if (changes.length > 0) {
    broadcastSync({ type: 'SYNC_UPDATE', changes });
  }
}

function dataEquals(a: SyncData, b: SyncData): boolean {
  return (
    a.name === b.name &&
    a.email === b.email &&
    a.age === b.age &&
    a.city === b.city
  );
}

async function updateSheetRow(rowIndex: number, data: SyncData): Promise<void> {
  const { updateSheetRow: updateRow } = await import('../google/sheets');
  await updateRow(rowIndex, data);
}

export async function initializeSync(): Promise<void> {
  try {
    await initializeSheet();
    logger.info('Sync engine initialized');
  } catch (error) {
    logger.error('Error initializing sync engine:', error);
    throw error;
  }
}

export function resetSyncState(): void {
  lastSyncState = null;
  logger.info('Sync state reset');
}

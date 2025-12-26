import express, { Request, Response } from 'express';
import {
  getAllData,
  insertData,
  updateData,
  deleteData,
  getDataByRowId,
  SyncData,
} from '../database/operations';
import { performSync, resetSyncState } from '../sync/sync-engine';
import { readSheetData, writeSheetData } from '../google/sheets';
import logger from '../utils/logger';

const router = express.Router();

router.get('/data', async (req: Request, res: Response) => {
  try {
    const data = await getAllData();
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch data' });
  }
});

router.get('/data/:rowId', async (req: Request, res: Response) => {
  try {
    const data = await getDataByRowId(req.params.rowId);
    if (data) {
      res.json({ success: true, data });
    } else {
      res.status(404).json({ success: false, error: 'Row not found' });
    }
  } catch (error) {
    logger.error('Error fetching row:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch row' });
  }
});

router.post('/data', async (req: Request, res: Response) => {
  try {
    const { name, email, age, city } = req.body;

    if (!name || !email || !age || !city) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const allData = await getAllData();
    const rowId = `row_${allData.length + 2}`;

    const newData: SyncData = {
      row_id: rowId,
      name,
      email,
      age: parseInt(age),
      city,
    };

    await insertData(newData);
    logger.info(`Created new row via API: ${rowId}`);

    res.json({ success: true, data: newData });
  } catch (error) {
    logger.error('Error creating row:', error);
    res.status(500).json({ success: false, error: 'Failed to create row' });
  }
});

router.put('/data/:rowId', async (req: Request, res: Response) => {
  try {
    const { name, email, age, city } = req.body;
    const rowId = req.params.rowId;

    const existing = await getDataByRowId(rowId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Row not found' });
    }

    const updatedData: SyncData = {
      row_id: rowId,
      name: name || existing.name,
      email: email || existing.email,
      age: age ? parseInt(age) : existing.age,
      city: city || existing.city,
    };

    await updateData(updatedData);
    logger.info(`Updated row via API: ${rowId}`);

    res.json({ success: true, data: updatedData });
  } catch (error) {
    logger.error('Error updating row:', error);
    res.status(500).json({ success: false, error: 'Failed to update row' });
  }
});

router.delete('/data/:rowId', async (req: Request, res: Response) => {
  try {
    const rowId = req.params.rowId;

    const existing = await getDataByRowId(rowId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Row not found' });
    }

    await deleteData(rowId);
    logger.info(`Deleted row via API: ${rowId}`);

    res.json({ success: true, message: 'Row deleted successfully' });
  } catch (error) {
    logger.error('Error deleting row:', error);
    res.status(500).json({ success: false, error: 'Failed to delete row' });
  }
});

router.post('/sync', async (req: Request, res: Response) => {
  try {
    await performSync();
    res.json({ success: true, message: 'Sync completed successfully' });
  } catch (error) {
    logger.error('Error during manual sync:', error);
    res.status(500).json({ success: false, error: 'Sync failed' });
  }
});

router.post('/sync/reset', async (req: Request, res: Response) => {
  try {
    resetSyncState();
    res.json({ success: true, message: 'Sync state reset successfully' });
  } catch (error) {
    logger.error('Error resetting sync state:', error);
    res.status(500).json({ success: false, error: 'Failed to reset sync state' });
  }
});

router.get('/sheet/data', async (req: Request, res: Response) => {
  try {
    const data = await readSheetData();
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error reading sheet data:', error);
    res.status(500).json({ success: false, error: 'Failed to read sheet data' });
  }
});

export default router;

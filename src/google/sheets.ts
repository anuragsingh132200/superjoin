import { google, sheets_v4 } from 'googleapis';
import { getAuthClient } from './auth';
import { config } from '../config';
import logger from '../utils/logger';
import { SyncData } from '../database/operations';

let sheetsAPI: sheets_v4.Sheets | null = null;

async function getSheetsAPI(): Promise<sheets_v4.Sheets> {
  if (!sheetsAPI) {
    const auth = await getAuthClient();
    sheetsAPI = google.sheets({ version: 'v4', auth });
  }
  return sheetsAPI;
}

export async function readSheetData(): Promise<SyncData[]> {
  try {
    const sheets = await getSheetsAPI();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.google.sheetId,
      range: 'Sheet1!A2:E',
    });

    const rows = response.data.values || [];
    const data: SyncData[] = rows.map((row, index) => ({
      row_id: `row_${index + 2}`,
      name: row[0] || '',
      email: row[1] || '',
      age: parseInt(row[2]) || 0,
      city: row[3] || '',
    }));

    logger.info(`Read ${data.length} rows from Google Sheets`);
    return data;
  } catch (error) {
    logger.error('Error reading from Google Sheets:', error);
    throw error;
  }
}

export async function writeSheetData(data: SyncData[]): Promise<void> {
  try {
    const sheets = await getSheetsAPI();

    await sheets.spreadsheets.values.clear({
      spreadsheetId: config.google.sheetId,
      range: 'Sheet1!A2:E',
    });

    const values = data.map(row => [
      row.name,
      row.email,
      row.age.toString(),
      row.city,
    ]);

    await sheets.spreadsheets.values.update({
      spreadsheetId: config.google.sheetId,
      range: 'Sheet1!A2:E',
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });

    logger.info(`Wrote ${data.length} rows to Google Sheets`);
  } catch (error) {
    logger.error('Error writing to Google Sheets:', error);
    throw error;
  }
}

export async function updateSheetRow(rowIndex: number, data: SyncData): Promise<void> {
  try {
    const sheets = await getSheetsAPI();
    const range = `Sheet1!A${rowIndex}:E${rowIndex}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: config.google.sheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[data.name, data.email, data.age.toString(), data.city]],
      },
    });

    logger.info(`Updated row ${rowIndex} in Google Sheets`);
  } catch (error) {
    logger.error('Error updating Google Sheets row:', error);
    throw error;
  }
}

export async function appendSheetRow(data: SyncData): Promise<void> {
  try {
    const sheets = await getSheetsAPI();

    await sheets.spreadsheets.values.append({
      spreadsheetId: config.google.sheetId,
      range: 'Sheet1!A:E',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[data.name, data.email, data.age.toString(), data.city]],
      },
    });

    logger.info(`Appended new row to Google Sheets`);
  } catch (error) {
    logger.error('Error appending to Google Sheets:', error);
    throw error;
  }
}

export async function initializeSheet(): Promise<void> {
  try {
    const sheets = await getSheetsAPI();

    await sheets.spreadsheets.values.update({
      spreadsheetId: config.google.sheetId,
      range: 'Sheet1!A1:E1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Name', 'Email', 'Age', 'City']],
      },
    });

    logger.info('Initialized Google Sheet with headers');
  } catch (error) {
    logger.error('Error initializing Google Sheet:', error);
    throw error;
  }
}

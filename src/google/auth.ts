import { google } from 'googleapis';
import fs from 'fs';
import { config } from '../config';
import logger from '../utils/logger';

let authClient: any = null;

export async function getAuthClient() {
  if (authClient) {
    return authClient;
  }

  try {
    const credentials = JSON.parse(fs.readFileSync(config.google.credentialsPath, 'utf8'));

    authClient = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    logger.info('Google Sheets authentication successful');
    return authClient;
  } catch (error) {
    logger.error('Failed to authenticate with Google Sheets:', error);
    throw error;
  }
}

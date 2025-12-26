import dotenv from 'dotenv';

dotenv.config();

export const config = {
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'syncuser',
    password: process.env.MYSQL_PASSWORD || 'syncpassword',
    database: process.env.MYSQL_DATABASE || 'superjoin_sync',
  },
  google: {
    sheetId: process.env.GOOGLE_SHEET_ID || '',
    credentialsPath: process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json',
  },
  app: {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    syncInterval: parseInt(process.env.SYNC_INTERVAL || '5000'),
  },
};

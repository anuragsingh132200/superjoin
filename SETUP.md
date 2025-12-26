# Superjoin Sync - Setup Guide

This guide will help you set up and run the Superjoin 2-way sync application.

## Prerequisites

- Docker and Docker Compose installed
- Git (optional, for cloning)
- Google Cloud Service Account with Sheets API access

## Quick Start

### 1. Configure Google Sheets

The application is already configured with the provided credentials for Sheet ID: `1nzPmi5Mx8TobBAvrVV1LrZ_KbFy03sqULYJ26KpLPlk`

Make sure the service account `sheets-bot@superjoin-sync-482322.iam.gserviceaccount.com` has access to your Google Sheet:

1. Open your Google Sheet
2. Click "Share"
3. Add the service account email: `sheets-bot@superjoin-sync-482322.iam.gserviceaccount.com`
4. Give it "Editor" permissions

### 2. Prepare the Google Sheet

Your Google Sheet should have the following structure:

| Name | Email | Age | City |
|------|-------|-----|------|
| John | john@example.com | 30 | New York |
| Jane | jane@example.com | 25 | London |

- Row 1: Headers (Name, Email, Age, City)
- Row 2+: Data

### 3. Start the Application

```bash
# Build and start all containers
docker-compose up --build
```

The application will:
- Start MySQL database on port 3306
- Start the Node.js application on port 3000
- Initialize the database schema
- Perform initial sync between Google Sheets and MySQL

### 4. Access the Dashboard

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the Superjoin dashboard with:
- Real-time data from both MySQL and Google Sheets
- Controls to manually sync, refresh, and reset
- Live sync logs
- Ability to add/delete rows

## Configuration

All configuration is done via the `.env` file:

```env
# MySQL Configuration
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USER=syncuser
MYSQL_PASSWORD=syncpassword
MYSQL_DATABASE=superjoin_sync
MYSQL_ROOT_PASSWORD=rootpassword

# Google Sheets Configuration
GOOGLE_SHEET_ID=1nzPmi5Mx8TobBAvrVV1LrZ_KbFy03sqULYJ26KpLPlk

# Application Configuration
PORT=3000
NODE_ENV=development
SYNC_INTERVAL=5000  # Sync every 5 seconds
```

## Testing the 2-Way Sync

### Test 1: Google Sheets → MySQL

1. Open the Google Sheet in your browser
2. Add a new row or edit an existing row
3. Wait 5 seconds (or click "Sync Now" in the dashboard)
4. Check the dashboard - you should see the changes reflected in MySQL

### Test 2: MySQL → Google Sheets

1. In the dashboard, click "Add New Row"
2. Fill in the details and submit
3. Wait 5 seconds (or click "Sync Now")
4. Check the Google Sheet - you should see the new row

### Test 3: Conflict Resolution

1. Edit the same row in both Google Sheets and the database
2. Wait for sync
3. The system uses "last-write-wins" strategy (database wins in conflicts)

## Stopping the Application

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (clears all data)
docker-compose down -v
```

## Troubleshooting

### Issue: Cannot connect to database

**Solution:** Wait for MySQL to fully start. The app has health checks and will retry automatically.

### Issue: Google Sheets API errors

**Solutions:**
- Verify the service account has access to the sheet
- Check that the Sheet ID in `.env` is correct
- Ensure the `credentials.json` file is present and valid

### Issue: Sync not working

**Solutions:**
- Check the sync logs in the dashboard
- Verify the Google Sheet has the correct headers (Name, Email, Age, City)
- Try clicking "Reset Sync State" to force a full resync

### Issue: WebSocket disconnected

**Solution:** The app will automatically reconnect. Refresh the page if needed.

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐
│  Google Sheets  │ ←──────→│   Sync Engine    │
└─────────────────┘         └──────────────────┘
                                     ↕
                            ┌──────────────────┐
                            │  MySQL Database  │
                            └──────────────────┘
                                     ↕
                            ┌──────────────────┐
                            │  WebSocket API   │
                            └──────────────────┘
                                     ↕
                            ┌──────────────────┐
                            │   Web Dashboard  │
                            └──────────────────┘
```

## Features

- ✅ Real-time 2-way sync between Google Sheets and MySQL
- ✅ Conflict resolution using last-write-wins strategy
- ✅ WebSocket-based live updates
- ✅ Change detection and incremental sync
- ✅ Comprehensive logging
- ✅ Docker containerization
- ✅ REST API for CRUD operations
- ✅ Multiplayer-ready (multiple users can edit simultaneously)

## API Endpoints

- `GET /api/data` - Get all data from MySQL
- `GET /api/data/:rowId` - Get specific row
- `POST /api/data` - Create new row
- `PUT /api/data/:rowId` - Update row
- `DELETE /api/data/:rowId` - Delete row
- `POST /api/sync` - Trigger manual sync
- `POST /api/sync/reset` - Reset sync state
- `GET /api/sheet/data` - Get data from Google Sheets

## Production Deployment

For production deployment:

1. Use environment-specific `.env` files
2. Enable HTTPS/WSS
3. Set `NODE_ENV=production`
4. Increase `SYNC_INTERVAL` to reduce API calls
5. Implement rate limiting
6. Add authentication/authorization
7. Use managed database service
8. Monitor logs and metrics

# Superjoin - 2-Way Google Sheets ↔ MySQL Sync

A production-ready system for real-time bi-directional synchronization between Google Sheets and MySQL database, built with Node.js, TypeScript, EJS, and Docker.

## Features

### Core Sync Capabilities
- ✅ **Complete 2-Way Sync** - Full bidirectional synchronization
  - Add row in dashboard → Syncs to MySQL → Appears in Google Sheets
  - Add row in Sheets → Syncs to MySQL → Appears in dashboard
  - Update in either source → Syncs to the other
  - Delete from either source → Syncs deletion to the other

### Advanced Features
- ✅ **Conflict Resolution** - Smart last-write-wins strategy for concurrent edits
- ✅ **WebSocket Live Updates** - Real-time dashboard updates without polling
- ✅ **Multiplayer Support** - Multiple users can edit simultaneously
- ✅ **Docker Containerized** - Complete application runs in Docker containers
- ✅ **RESTful API** - Full CRUD operations via REST endpoints
- ✅ **Change Detection** - Efficient incremental sync with state tracking
- ✅ **Comprehensive Logging** - Detailed sync logs and error tracking
- ✅ **Production-Ready** - Error handling, retry logic, and graceful shutdowns

## Tech Stack

- **Backend**: Node.js, TypeScript, Express.js
- **Frontend**: EJS templates, Vanilla JavaScript, WebSocket
- **Database**: MySQL 8.0
- **Google API**: Google Sheets API v4
- **Containerization**: Docker, Docker Compose
- **Logging**: Winston

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Google Cloud Service Account credentials (already configured)

### 1. Share Google Sheet with Service Account

Share the Google Sheet with this email address:
```
sheets-bot@superjoin-sync-482322.iam.gserviceaccount.com
```
Give it **Editor** permissions.

### 2. Start the Application

```bash
# Clone the repository (if needed)
git clone <repository-url>
cd superjoin

# Start all services
docker-compose up --build
```

### 3. Access the Dashboard

Open your browser and navigate to:
```
http://localhost:3000
```

### 4. Test the 2-Way Sync

**Test Google Sheets → MySQL:**
1. Open the Google Sheet
2. Add/edit/delete a row
3. Wait 5 seconds or click "Sync Now" in dashboard
4. See changes reflected in the MySQL Database section

**Test MySQL → Google Sheets:**
1. Click "Add New Row" in the dashboard
2. Fill in the details and submit
3. Wait 5 seconds or click "Sync Now"
4. Check the Google Sheet - new row appears automatically

**Test Delete Sync:**
1. Delete a row from either source (dashboard or Google Sheets)
2. Wait 5 seconds or click "Sync Now"
3. Deletion syncs to the other source

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive testing scenarios.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│                    (EJS + WebSocket Client)                  │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/WebSocket
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Express.js Server                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  REST API    │  │  WebSocket   │  │ Sync Engine  │      │
│  │  Endpoints   │  │   Server     │  │   (Timer)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────┬──────────────────────────────┬────────────────┘
              │                              │
    ┌─────────┴─────────┐         ┌─────────┴─────────┐
    ↓                   ↓         ↓                   ↓
┌─────────┐      ┌──────────────┐ ┌──────────────┐  ┌─────────┐
│ MySQL   │      │ Change       │ │ Conflict     │  │ Google  │
│Database │←────→│ Detector     │←│ Resolver     │→│ Sheets  │
└─────────┘      └──────────────┘ └──────────────┘  └─────────┘
```

## Key Components

### Sync Engine
- Polls both sources every 5 seconds (configurable)
- Detects changes using state comparison
- Resolves conflicts using last-write-wins
- Logs all sync operations

### Conflict Resolution Strategy
- **Concurrent Edits**: Database wins (last-write-wins from DB perspective)
- **New Row**: Source of creation is preserved
- **Deletions**: Handled gracefully on next sync

### Change Detection
- Maintains in-memory state of last sync
- Compares current state with previous state
- Only syncs changed/new/deleted rows
- Efficient for large datasets

### WebSocket Integration
- Real-time updates to connected clients
- Automatic reconnection on disconnect
- Broadcasts sync events to all clients

## Project Structure

```
superjoin/
├── src/
│   ├── api/
│   │   └── routes.ts          # REST API endpoints
│   ├── config/
│   │   └── index.ts           # Configuration management
│   ├── database/
│   │   ├── connection.ts      # MySQL connection pool
│   │   └── operations.ts      # Database CRUD operations
│   ├── google/
│   │   ├── auth.ts            # Google API authentication
│   │   └── sheets.ts          # Sheets API operations
│   ├── sync/
│   │   ├── sync-engine.ts     # Core sync logic
│   │   └── websocket.ts       # WebSocket server
│   ├── utils/
│   │   └── logger.ts          # Winston logger
│   └── index.ts               # Application entry point
├── views/
│   └── index.ejs              # Dashboard template
├── public/
│   └── app.js                 # Frontend JavaScript
├── docker-compose.yml         # Docker orchestration
├── Dockerfile                 # Application container
├── init.sql                   # Database schema
├── credentials.json           # Google service account
└── .env                       # Environment variables
```

## API Documentation

### Data Endpoints

- `GET /api/data` - Retrieve all rows from MySQL
- `GET /api/data/:rowId` - Retrieve specific row
- `POST /api/data` - Create new row
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "city": "New York"
  }
  ```
- `PUT /api/data/:rowId` - Update existing row
- `DELETE /api/data/:rowId` - Delete row

### Sync Endpoints

- `POST /api/sync` - Trigger manual sync
- `POST /api/sync/reset` - Reset sync state (force full resync)
- `GET /api/sheet/data` - Retrieve data from Google Sheets

## Configuration

Edit `.env` to configure the application:

```env
# Sync interval in milliseconds (default: 5000 = 5 seconds)
SYNC_INTERVAL=5000

# Application port
PORT=3000

# MySQL settings
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USER=syncuser
MYSQL_PASSWORD=syncpassword
MYSQL_DATABASE=superjoin_sync
```

## Edge Cases Handled

1. **Empty Sources**: Initial sync handles empty database or empty sheet
2. **Concurrent Edits**: Conflict resolution with last-write-wins
3. **Network Failures**: Retry logic and error recovery
4. **Invalid Data**: Validation and error logging
5. **Connection Loss**: WebSocket auto-reconnect
6. **Multiple Users**: Supports simultaneous edits (multiplayer)
7. **Large Datasets**: Efficient change detection
8. **Database Disconnection**: Connection pooling and health checks

## Scalability Considerations

- **Connection Pooling**: MySQL connection pool for concurrent requests
- **State Management**: In-memory state for fast comparisons
- **Incremental Sync**: Only syncs changed data, not full dataset
- **WebSocket Broadcasting**: Efficient real-time updates
- **Containerization**: Easy horizontal scaling with Docker
- **Logging**: Structured logging for monitoring
- **Error Recovery**: Graceful error handling and retries

## Development

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Start MySQL separately
# Update .env with MySQL connection details

# Run in development mode
npm run dev
```

### Build TypeScript

```bash
npm run build
```

### Production Mode

```bash
npm start
```

## Monitoring

- **Logs**: Check `combined.log` and `error.log` files
- **Dashboard**: Real-time sync logs in the UI
- **Database**: Connect to MySQL on `localhost:3306`
- **WebSocket**: Monitor connection status in dashboard

## Troubleshooting

See [SETUP.md](SETUP.md) for detailed troubleshooting guide.

## License

MIT

## Submission Details

**Assignment**: FDE Internship - Superjoin
**Sheet ID**: `1nzPmi5Mx8TobBAvrVV1LrZ_KbFy03sqULYJ26KpLPlk`
**Service Account**: `sheets-bot@superjoin-sync-482322.iam.gserviceaccount.com`

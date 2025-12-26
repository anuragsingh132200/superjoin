# Testing Guide - 2-Way Sync Functionality

This guide demonstrates how to test the complete bi-directional synchronization between Google Sheets and MySQL.

## Current Implementation

The system now supports **complete 2-way synchronization** with the following operations:

### ✅ Supported Operations

1. **Dashboard → Database → Google Sheets**
   - Add row in dashboard → Saves to MySQL → Syncs to Google Sheets
   - Update row in dashboard → Updates MySQL → Syncs to Google Sheets
   - Delete row in dashboard → Deletes from MySQL → Syncs to Google Sheets

2. **Google Sheets → Database**
   - Add row in Sheets → Syncs to MySQL
   - Update row in Sheets → Syncs to MySQL
   - Delete row in Sheets → Syncs to MySQL

3. **Conflict Resolution**
   - Concurrent edits → Database wins (last-write-wins)
   - Prevents data loss
   - Logs all conflicts

## Test Scenarios

### Test 1: Add Row from Dashboard

**Steps:**
1. Open the dashboard at `http://localhost:3000`
2. Click **"Add New Row"** button
3. Fill in the form:
   - Name: `Alice Johnson`
   - Email: `alice@example.com`
   - Age: `28`
   - City: `San Francisco`
4. Click **"Add Row"**

**Expected Result:**
- ✅ Row appears immediately in the "MySQL Database" section
- ✅ Wait 5 seconds (or click "Sync Now")
- ✅ Row appears in Google Sheets
- ✅ Log shows: "Detected new row in database, synced to sheet"

### Test 2: Add Row in Google Sheets

**Steps:**
1. Open your Google Sheet
2. Add a new row at the bottom:
   | Name | Email | Age | City |
   |------|-------|-----|------|
   | Bob Smith | bob@example.com | 35 | London |
3. Wait 5 seconds or click "Sync Now" in dashboard

**Expected Result:**
- ✅ Row appears in the "Google Sheets" section of dashboard
- ✅ Row appears in the "MySQL Database" section
- ✅ Log shows: "Detected new row in sheet: row_X"

### Test 3: Update Row in Google Sheets

**Steps:**
1. Open your Google Sheet
2. Find an existing row
3. Change the name from "Alice Johnson" to "Alice Williams"
4. Wait 5 seconds or click "Sync Now"

**Expected Result:**
- ✅ Dashboard shows updated name in both sections
- ✅ MySQL database is updated
- ✅ Log shows: "Detected update in sheet: row_X"

### Test 4: Update Row from Dashboard

**Steps:**
1. Currently, direct edit in dashboard is not enabled
2. You can test by using the API:
   ```bash
   curl -X PUT http://localhost:3000/api/data/row_2 \
     -H "Content-Type: application/json" \
     -d '{"name":"Updated Name","email":"updated@example.com","age":30,"city":"New York"}'
   ```
3. Wait 5 seconds or click "Sync Now"

**Expected Result:**
- ✅ Dashboard shows updated data
- ✅ Google Sheets shows updated data
- ✅ Log shows: "Synced database update to sheet: row_X"

### Test 5: Delete Row from Dashboard

**Steps:**
1. In the dashboard, find a row in the "MySQL Database" section
2. Click the **"Delete"** button
3. Confirm the deletion
4. Wait 5 seconds or click "Sync Now"

**Expected Result:**
- ✅ Row disappears from dashboard
- ✅ Row disappears from Google Sheets
- ✅ Log shows: "Row deleted from database, synced to sheet"

### Test 6: Delete Row from Google Sheets

**Steps:**
1. Open your Google Sheet
2. Select an entire row (click the row number)
3. Right-click → Delete row
4. Wait 5 seconds or click "Sync Now" in dashboard

**Expected Result:**
- ✅ Row disappears from dashboard
- ✅ Row disappears from MySQL database
- ✅ Log shows: "Row deleted from sheet, synced to database"

### Test 7: Concurrent Edit (Conflict Resolution)

**Steps:**
1. Edit the same row in both Google Sheets and MySQL at the same time
2. In Sheets: Change name to "John A"
3. In Dashboard: Use API to change name to "John B"
4. Wait for sync

**Expected Result:**
- ✅ Database value wins (John B)
- ✅ Google Sheets is updated to match database
- ✅ Log shows: "Conflict detected for row_X, using last-write-wins (database wins)"

### Test 8: Multiplayer Mode

**Steps:**
1. Open dashboard in 2 different browsers
2. In Browser 1: Add a row
3. In Browser 2: Should see the update via WebSocket

**Expected Result:**
- ✅ Both browsers show real-time updates
- ✅ WebSocket broadcasts changes to all clients
- ✅ No page refresh needed

### Test 9: Initial Sync

**Steps:**
1. Stop the application
2. Add rows directly to Google Sheets
3. Start the application with `docker-compose up`

**Expected Result:**
- ✅ All rows from Google Sheets are imported to MySQL
- ✅ Dashboard shows all data
- ✅ Log shows: "Initial sync: Imported X rows from sheet to database"

### Test 10: Sync Reset

**Steps:**
1. Click **"Reset Sync State"** in dashboard
2. Click **"Sync Now"**

**Expected Result:**
- ✅ Full re-sync is performed
- ✅ Both sources are reconciled
- ✅ Database is used as source of truth

## Sync Flow Diagram

```
┌─────────────────┐
│   User Action   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ↓         ↓
┌────────┐  ┌─────────┐
│Dashboard│  │ Sheets  │
│(Add Row)│  │(Add Row)│
└────┬────┘  └────┬────┘
     │            │
     ↓            ↓
┌─────────────────────┐
│   MySQL Database    │←─── Changes saved here first
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   Sync Engine       │←─── Runs every 5 seconds
│  (Change Detector)  │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     ↓           ↓
┌─────────┐  ┌─────────┐
│  MySQL  │  │ Sheets  │←─── Changes propagated
└─────────┘  └─────────┘
     │           │
     └─────┬─────┘
           ↓
┌─────────────────────┐
│   WebSocket         │←─── Broadcasts to all clients
│   (Live Updates)    │
└─────────────────────┘
```

## API Testing

### Add Row via API
```bash
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Charlie Brown",
    "email": "charlie@example.com",
    "age": 42,
    "city": "Chicago"
  }'
```

### Update Row via API
```bash
curl -X PUT http://localhost:3000/api/data/row_2 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "email": "updated@example.com",
    "age": 30,
    "city": "Boston"
  }'
```

### Delete Row via API
```bash
curl -X DELETE http://localhost:3000/api/data/row_3
```

### Get All Data
```bash
curl http://localhost:3000/api/data
```

### Trigger Manual Sync
```bash
curl -X POST http://localhost:3000/api/sync
```

## Monitoring Sync

### Check Logs
```bash
# View live logs
docker-compose logs -f app

# View sync logs in dashboard
# Open http://localhost:3000 and check the "Sync Logs" section
```

### Database Query
```bash
# Connect to MySQL
docker exec -it superjoin-mysql mysql -u syncuser -psyncpassword superjoin_sync

# View all data
SELECT * FROM sync_data;

# View sync logs
SELECT * FROM sync_log ORDER BY timestamp DESC LIMIT 10;
```

## Expected Behavior

### Sync Timing
- **Automatic Sync**: Every 5 seconds (configurable via `SYNC_INTERVAL`)
- **Manual Sync**: Click "Sync Now" button
- **Initial Sync**: On application startup

### Data Flow
1. **User adds row in dashboard** → Saved to MySQL → Next sync → Appears in Google Sheets
2. **User adds row in Sheets** → Next sync → Saved to MySQL → Appears in dashboard
3. **User updates in Sheets** → Next sync → MySQL updated → Dashboard refreshed
4. **User deletes from dashboard** → MySQL deletion → Next sync → Removed from Sheets

### Real-time Updates
- WebSocket connection keeps dashboard live
- All connected clients receive updates
- Auto-reconnect on connection loss

## Troubleshooting

### Sync Not Working
1. Check sync logs in dashboard
2. Verify Google Sheet permissions
3. Click "Reset Sync State" and "Sync Now"

### Data Not Appearing
1. Wait for next sync cycle (5 seconds)
2. Check MySQL database directly
3. Verify Google Sheets API credentials

### Conflicts
- Database always wins in conflicts
- Check sync logs for conflict messages
- Use "Reset Sync State" to force reconciliation

## Success Criteria

✅ **All tests should pass with:**
- Data syncs in both directions
- Changes appear within 5 seconds
- No data loss
- Conflicts resolved properly
- Real-time updates work
- Multiple users supported

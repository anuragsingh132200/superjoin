# Complete 2-Way Sync Flow

## How It Works

The system implements **true bidirectional synchronization** between Google Sheets and MySQL database. Here's how each operation flows through the system:

## 1. Add Row from Dashboard → Google Sheets

```
┌──────────────────────────────────────────────────────────────┐
│ Step 1: User adds row in dashboard                          │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 2: POST /api/data endpoint receives request            │
│         - Validates data (name, email, age, city)           │
│         - Generates unique row_id                           │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 3: Data inserted into MySQL database                   │
│         - INSERT INTO sync_data                             │
│         - Row saved with row_id, version, timestamp         │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 4: Wait for sync cycle (every 5 seconds)               │
│         OR click "Sync Now" button                          │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 5: Sync Engine detects new row in database             │
│         - Compares current DB state with last sync state    │
│         - Finds: newDbData && !oldDbData                    │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 6: Sync Engine appends row to Google Sheets            │
│         - Calls appendSheetRow(newDbData)                   │
│         - Google Sheets API appends new row                 │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 7: Sync complete - row now exists in both sources      │
│         - Logs: "Detected new row in database, synced to   │
│           sheet"                                            │
│         - WebSocket broadcasts change to all clients        │
└──────────────────────────────────────────────────────────────┘
```

## 2. Add Row from Google Sheets → Database

```
┌──────────────────────────────────────────────────────────────┐
│ Step 1: User adds row in Google Sheets                      │
│         - Opens sheet in browser                            │
│         - Types: John | john@ex.com | 30 | NYC              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 2: Wait for sync cycle (every 5 seconds)               │
│         OR click "Sync Now" in dashboard                    │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 3: Sync Engine reads Google Sheets data                │
│         - Calls readSheetData()                             │
│         - Gets all rows from Sheet1!A2:E                    │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 4: Sync Engine detects new row in sheet                │
│         - Compares with last sync state                     │
│         - Finds: newSheetData && !oldSheetData              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 5: Row inserted into MySQL database                    │
│         - Calls insertData(newSheetData)                    │
│         - INSERT INTO sync_data                             │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 6: Sync complete - row now exists in both sources      │
│         - Logs: "Detected new row in sheet: row_X"          │
│         - WebSocket broadcasts change to all clients        │
│         - Dashboard auto-refreshes to show new row          │
└──────────────────────────────────────────────────────────────┘
```

## 3. Update Row in Google Sheets → Database

```
┌──────────────────────────────────────────────────────────────┐
│ Step 1: User edits existing row in Google Sheets            │
│         - Changes "Alice" to "Alice Johnson"                │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 2: Sync cycle runs (every 5 seconds)                   │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 3: Sync Engine detects change                          │
│         - Compares: newSheetData !== oldSheetData           │
│         - Uses dataEquals() to check each field             │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 4: Database updated                                     │
│         - UPDATE sync_data SET name='Alice Johnson'         │
│         - Version incremented                               │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 5: Change synced and broadcasted                       │
│         - Logs: "Detected update in sheet"                  │
│         - WebSocket notifies all clients                    │
└──────────────────────────────────────────────────────────────┘
```

## 4. Update Row in Database → Google Sheets

```
┌──────────────────────────────────────────────────────────────┐
│ Step 1: Row updated via API or direct DB modification       │
│         - PUT /api/data/row_2                               │
│         - Or: UPDATE sync_data SET ...                      │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 2: Sync cycle runs                                      │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 3: Sync Engine detects DB change                       │
│         - Compares: newDbData !== oldDbData                 │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 4: Google Sheets row updated                           │
│         - Finds row index in sheet                          │
│         - Calls updateSheetRow(rowIndex, newDbData)         │
│         - Google Sheets API updates the row                 │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 5: Change synced                                        │
│         - Logs: "Synced database update to sheet"           │
└──────────────────────────────────────────────────────────────┘
```

## 5. Delete Row from Dashboard → Google Sheets

```
┌──────────────────────────────────────────────────────────────┐
│ Step 1: User clicks Delete button in dashboard              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 2: DELETE /api/data/row_X endpoint called              │
│         - Deletes from MySQL: DELETE FROM sync_data         │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 3: Sync cycle runs                                      │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 4: Sync Engine detects deletion                        │
│         - Finds: !newDbData && oldDbData existed            │
│         - Row exists in sheet but not in DB                 │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 5: Row removed from Google Sheets                      │
│         - Filters out deleted row                           │
│         - Rewrites entire sheet without deleted row         │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 6: Deletion synced                                      │
│         - Logs: "Row deleted from database, synced to sheet"│
└──────────────────────────────────────────────────────────────┘
```

## 6. Delete Row from Google Sheets → Database

```
┌──────────────────────────────────────────────────────────────┐
│ Step 1: User deletes row in Google Sheets                   │
│         - Right-click row → Delete row                      │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 2: Sync cycle runs                                      │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 3: Sync Engine detects missing row                     │
│         - Row existed in oldSheetData                       │
│         - Row missing in newSheetData                       │
│         - Row still exists in database                      │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 4: Row deleted from MySQL database                     │
│         - DELETE FROM sync_data WHERE row_id = ?            │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 5: Deletion synced                                      │
│         - Logs: "Row deleted from sheet, synced to database"│
│         - WebSocket broadcasts deletion                     │
│         - Dashboard removes row                             │
└──────────────────────────────────────────────────────────────┘
```

## 7. Conflict Resolution

```
┌──────────────────────────────────────────────────────────────┐
│ Scenario: Same row edited in both sources simultaneously    │
│ - User A: Edits in Google Sheets (name = "John A")          │
│ - User B: Edits via API (name = "John B")                   │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 1: Sync cycle runs                                      │
│         - Detects: newSheetData !== oldSheetData            │
│         - Detects: newDbData !== oldDbData                  │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 2: Conflict detected!                                   │
│         - Both sources changed since last sync              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 3: Apply conflict resolution strategy                  │
│         - Strategy: Last-write-wins (Database wins)         │
│         - Database value is considered source of truth      │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 4: Overwrite Google Sheets with DB value               │
│         - updateSheetRow(rowIndex, newDbData)               │
│         - Sheets now shows "John B"                         │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 5: Log conflict resolution                              │
│         - Logs: "Conflict detected for row_X, using         │
│           last-write-wins (database wins)"                  │
└──────────────────────────────────────────────────────────────┘
```

## Sync State Management

The sync engine maintains an in-memory state to efficiently detect changes:

```typescript
interface SyncState {
  sheetData: Map<string, SyncData>;  // Previous sheet state
  dbData: Map<string, SyncData>;     // Previous DB state
}

let lastSyncState: SyncState | null = null;
```

Each sync cycle:
1. Reads current state from both sources
2. Compares with `lastSyncState`
3. Identifies changes (inserts, updates, deletes)
4. Applies changes to opposite source
5. Updates `lastSyncState` for next cycle

## WebSocket Real-time Updates

```
┌──────────────────────────────────────────────────────────────┐
│ Any change in either source                                  │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ Sync Engine processes change                                 │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ broadcastSync({ type: 'SYNC_UPDATE', changes: [...] })      │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ All connected WebSocket clients receive update              │
│ - Browser 1: Updates UI                                     │
│ - Browser 2: Updates UI                                     │
│ - Browser N: Updates UI                                     │
└──────────────────────────────────────────────────────────────┘
```

## Summary

✅ **Dashboard → Database → Sheets**: Full support
✅ **Sheets → Database → Dashboard**: Full support
✅ **Conflict Resolution**: Database wins
✅ **Real-time Updates**: WebSocket broadcasting
✅ **Multiplayer**: Multiple users supported
✅ **All Operations**: Insert, Update, Delete

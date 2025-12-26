# Quick Start Guide

## 🚀 Get Started in 3 Minutes

### Step 1: Share the Google Sheet
Share your Google Sheet with:
```
sheets-bot@superjoin-sync-482322.iam.gserviceaccount.com
```
**Permission**: Editor

### Step 2: Prepare Your Sheet
Your Google Sheet should look like this:

| Name | Email | Age | City |
|------|-------|-----|------|
| John Doe | john@example.com | 30 | New York |
| Jane Smith | jane@example.com | 25 | London |

- **Row 1**: Headers (Name, Email, Age, City)
- **Row 2+**: Data

### Step 3: Start the Application
```bash
docker-compose up --build
```

### Step 4: Access Dashboard
```
http://localhost:3000
```

## ✅ 2-Way Sync - How It Works

### Add Row from Dashboard
```
You add row in Dashboard
    ↓
Saves to MySQL
    ↓
Wait 5 seconds (or click "Sync Now")
    ↓
Appears in Google Sheets ✓
```

### Add Row from Google Sheets
```
You add row in Google Sheets
    ↓
Wait 5 seconds (or click "Sync Now")
    ↓
Saves to MySQL
    ↓
Appears in Dashboard ✓
```

### Update Row
```
Edit in either source
    ↓
Wait 5 seconds
    ↓
Updates in the other source ✓
```

### Delete Row
```
Delete from either source
    ↓
Wait 5 seconds
    ↓
Deletes from the other source ✓
```

## 🎯 Quick Test

1. **Open Dashboard**: `http://localhost:3000`
2. **Click "Add New Row"**
3. **Fill in**: Name: "Test User", Email: "test@test.com", Age: 25, City: "Boston"
4. **Click "Add Row"**
5. **Click "Sync Now"** (or wait 5 seconds)
6. **Open Google Sheet** - See the new row! ✓

## 📊 Dashboard Features

- **MySQL Database**: Shows current database state
- **Google Sheets**: Shows current sheet state
- **Sync Now**: Trigger immediate sync
- **Refresh Data**: Reload data from both sources
- **Reset Sync State**: Force full resynchronization
- **Add New Row**: Insert new data
- **Delete**: Remove rows
- **Sync Logs**: Real-time sync activity

## 🔄 Sync Behavior

- **Automatic Sync**: Every 5 seconds
- **Manual Sync**: Click "Sync Now" button
- **Real-time Updates**: WebSocket broadcasts to all users
- **Conflict Resolution**: Database wins in conflicts

## 📝 Example Operations

### Add via Dashboard
```bash
# Dashboard UI
Click "Add New Row"
→ Name: Alice
→ Email: alice@example.com
→ Age: 28
→ City: San Francisco

Result: Row in MySQL → Syncs to Sheets
```

### Add via API
```bash
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Smith",
    "email": "bob@example.com",
    "age": 35,
    "city": "London"
  }'

Result: Row in MySQL → Syncs to Sheets
```

### Add in Google Sheets
```
1. Open the Google Sheet
2. Add a row: Charlie | charlie@example.com | 40 | Paris
3. Wait 5 seconds

Result: Row in Sheets → Syncs to MySQL → Appears in Dashboard
```

## 🛠️ Troubleshooting

### Sync Not Working?
1. Check if service account has access to the sheet
2. Click "Reset Sync State" button
3. Click "Sync Now" button
4. Check sync logs in dashboard

### Data Not Appearing?
1. Wait 5 seconds for automatic sync
2. Or click "Sync Now"
3. Check both "MySQL Database" and "Google Sheets" sections

### WebSocket Disconnected?
1. Refresh the page
2. Auto-reconnect happens every 5 seconds

## 🔗 Important Links

- **Dashboard**: http://localhost:3000
- **Google Sheet**: https://docs.google.com/spreadsheets/d/1nzPmi5Mx8TobBAvrVV1LrZ_KbFy03sqULYJ26KpLPlk
- **API Docs**: See [README.md](README.md#api-documentation)
- **Testing Guide**: See [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Sync Flow**: See [SYNC_FLOW.md](SYNC_FLOW.md)

## 🎉 Success Checklist

- [ ] Google Sheet shared with service account
- [ ] Application running (`docker-compose up`)
- [ ] Dashboard accessible at http://localhost:3000
- [ ] Can add row in dashboard
- [ ] Row appears in Google Sheets after sync
- [ ] Can add row in Google Sheets
- [ ] Row appears in dashboard after sync
- [ ] WebSocket shows "Connected" status
- [ ] Sync logs show activity

## 📞 Need Help?

1. Check [SETUP.md](SETUP.md) for detailed setup instructions
2. Check [TESTING_GUIDE.md](TESTING_GUIDE.md) for test scenarios
3. Check sync logs in dashboard for errors
4. Review Docker logs: `docker-compose logs -f app`

---

**Ready to test?** Add a row in the dashboard and watch it appear in Google Sheets! 🚀

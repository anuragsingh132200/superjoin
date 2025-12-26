# Deployment Checklist

Use this checklist to ensure successful deployment of the Superjoin 2-Way Sync application.

## Pre-Deployment Checklist

### ✅ Google Sheets Setup
- [ ] Google Sheet created with correct headers (Name, Email, Age, City)
- [ ] Service account email added to sheet with Editor permissions
  - Email: `sheets-bot@superjoin-sync-482322.iam.gserviceaccount.com`
- [ ] Sheet ID confirmed in `.env` file
  - Current: `1nzPmi5Mx8TobBAvrVV1LrZ_KbFy03sqULYJ26KpLPlk`
- [ ] Test data added to sheet (optional)

### ✅ Environment Setup
- [ ] Docker installed and running
- [ ] Docker Compose installed
- [ ] `.env` file exists with correct values
- [ ] `credentials.json` file exists in project root
- [ ] No port conflicts (3000 for app, 3306 for MySQL)

### ✅ Configuration Review
- [ ] Reviewed `.env` settings
- [ ] Sync interval appropriate (default: 5000ms = 5 seconds)
- [ ] MySQL credentials secure
- [ ] NODE_ENV set correctly (development/production)

## Deployment Steps

### Step 1: Initial Setup
```bash
# Clone repository (if not already done)
git clone <repository-url>
cd superjoin

# Verify files exist
ls -la
# Should see: Dockerfile, docker-compose.yml, .env, credentials.json, etc.
```
- [ ] Repository cloned
- [ ] All files present

### Step 2: Build and Start
```bash
# Build and start all containers
docker-compose up --build
```
- [ ] MySQL container started successfully
- [ ] Application container started successfully
- [ ] No errors in build process
- [ ] Database initialized (init.sql executed)

### Step 3: Verify Services

#### Check Container Status
```bash
# In a new terminal
docker-compose ps
```
Expected output:
```
NAME                COMMAND                  STATUS
superjoin-app       "npm start"              Up
superjoin-mysql     "docker-entrypoint.s…"   Up (healthy)
```
- [ ] Both containers running
- [ ] MySQL container shows "healthy" status

#### Check Logs
```bash
# Application logs
docker-compose logs app | tail -20

# MySQL logs
docker-compose logs mysql | tail -20
```
- [ ] No critical errors in logs
- [ ] Database connection successful message
- [ ] Sync engine initialized message
- [ ] Server running message

### Step 4: Access Dashboard
```bash
# Open browser to:
http://localhost:3000
```
- [ ] Dashboard loads successfully
- [ ] WebSocket shows "Connected" status
- [ ] Both data sections visible (MySQL Database, Google Sheets)
- [ ] No JavaScript errors in browser console

### Step 5: Test Basic Functionality

#### Test 1: Data Display
- [ ] MySQL Database section shows data (if any exists)
- [ ] Google Sheets section shows data (if any exists)
- [ ] Data matches between sources

#### Test 2: Add Row from Dashboard
- [ ] Click "Add New Row" button
- [ ] Form appears
- [ ] Fill in: Name, Email, Age, City
- [ ] Click "Add Row"
- [ ] Row appears in MySQL Database section immediately
- [ ] Click "Sync Now" or wait 5 seconds
- [ ] Row appears in Google Sheets
- [ ] Sync log shows: "Detected new row in database, synced to sheet"

#### Test 3: Add Row from Google Sheets
- [ ] Open Google Sheet in browser
- [ ] Add new row with data
- [ ] Return to dashboard
- [ ] Click "Sync Now" or wait 5 seconds
- [ ] Row appears in both sections
- [ ] Sync log shows: "Detected new row in sheet"

#### Test 4: Update Row
- [ ] Edit a row in Google Sheets
- [ ] Wait for sync (5 seconds) or click "Sync Now"
- [ ] Dashboard shows updated data
- [ ] Sync log shows: "Detected update in sheet"

#### Test 5: Delete Row
- [ ] Click "Delete" button on a row in dashboard
- [ ] Confirm deletion
- [ ] Row disappears from dashboard
- [ ] Wait for sync or click "Sync Now"
- [ ] Row disappears from Google Sheets
- [ ] Sync log shows: "Row deleted from database, synced to sheet"

### Step 6: Test Advanced Features

#### Test WebSocket
- [ ] Open dashboard in two browser windows
- [ ] Add row in one window
- [ ] Other window updates automatically
- [ ] WebSocket status shows "Connected" in both

#### Test Manual Sync
- [ ] Click "Sync Now" button
- [ ] Sync log shows "Manual sync initiated"
- [ ] Sync log shows "Manual sync completed successfully"

#### Test Refresh Data
- [ ] Click "Refresh Data" button
- [ ] Both sections reload
- [ ] Data remains consistent

#### Test Reset Sync State
- [ ] Click "Reset Sync State" button
- [ ] Confirm action
- [ ] Sync log shows "Sync state reset successfully"
- [ ] Click "Sync Now"
- [ ] Full resync occurs

## Post-Deployment Checklist

### ✅ Monitoring
- [ ] Sync logs showing regular activity
- [ ] No errors in application logs
- [ ] No errors in MySQL logs
- [ ] WebSocket connections stable

### ✅ Performance
- [ ] Sync completing within 5 seconds
- [ ] Dashboard responsive
- [ ] No memory leaks (check with `docker stats`)
- [ ] Database queries fast

### ✅ Data Integrity
- [ ] Data consistent between MySQL and Sheets
- [ ] No duplicate rows
- [ ] All fields syncing correctly
- [ ] Timestamps updating properly

### ✅ Error Handling
- [ ] Disconnect and reconnect MySQL → App recovers
- [ ] Close and reopen browser → WebSocket reconnects
- [ ] Add invalid data → Proper error shown
- [ ] Network issues → Logs show retries

## Production Deployment Additional Steps

### Security
- [ ] Change default MySQL passwords in `.env`
- [ ] Remove credentials.json from public repositories
- [ ] Add `.gitignore` for sensitive files
- [ ] Use environment variables for production
- [ ] Enable HTTPS for production
- [ ] Implement authentication for dashboard

### Scalability
- [ ] Increase MySQL connection pool if needed
- [ ] Adjust sync interval based on load
- [ ] Set up monitoring (Prometheus, Grafana)
- [ ] Configure log rotation
- [ ] Set up database backups
- [ ] Consider Redis for distributed state

### High Availability
- [ ] Use managed MySQL (AWS RDS, Google Cloud SQL)
- [ ] Deploy multiple app instances behind load balancer
- [ ] Set up health check endpoints
- [ ] Configure auto-restart policies
- [ ] Set up alerts for failures

## Troubleshooting

### Issue: Containers won't start
```bash
# Check Docker daemon
docker ps

# Check logs
docker-compose logs

# Rebuild
docker-compose down
docker-compose up --build
```

### Issue: Can't connect to MySQL
```bash
# Check MySQL is healthy
docker-compose ps

# Check MySQL logs
docker-compose logs mysql

# Verify credentials in .env
cat .env
```

### Issue: Sync not working
- [ ] Check sync logs in dashboard
- [ ] Verify Google Sheet permissions
- [ ] Click "Reset Sync State"
- [ ] Check credentials.json is valid
- [ ] Verify Sheet ID in .env

### Issue: WebSocket disconnected
- [ ] Refresh browser page
- [ ] Check application logs
- [ ] Verify port 3000 is accessible
- [ ] Check firewall settings

## Success Criteria

All of the following should be true:

✅ Both containers running and healthy
✅ Dashboard accessible at http://localhost:3000
✅ WebSocket connected
✅ Can add row from dashboard → Appears in Sheets
✅ Can add row in Sheets → Appears in dashboard
✅ Can update in either source → Updates in other
✅ Can delete from either source → Deletes from other
✅ Real-time updates working
✅ Sync logs showing activity
✅ No errors in logs

## Commands Reference

```bash
# Start application
docker-compose up --build

# Start in background
docker-compose up -d

# Stop application
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs -f app

# Restart specific service
docker-compose restart app

# Check container status
docker-compose ps

# Execute command in container
docker exec -it superjoin-app sh

# Connect to MySQL
docker exec -it superjoin-mysql mysql -u syncuser -psyncpassword superjoin_sync

# View resource usage
docker stats
```

## Support

If you encounter issues:

1. Check logs: `docker-compose logs -f app`
2. Review [SETUP.md](SETUP.md)
3. Review [TESTING_GUIDE.md](TESTING_GUIDE.md)
4. Check sync logs in dashboard
5. Try "Reset Sync State" button

---

**Deployment Status**: [ ] Not Started | [ ] In Progress | [ ] Complete
**Deployed By**: _______________
**Deployment Date**: _______________
**Environment**: [ ] Development | [ ] Staging | [ ] Production

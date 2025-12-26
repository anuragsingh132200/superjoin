let ws = null;
let reconnectInterval = null;

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket connected');
        updateStatus(true);
        addLog('WebSocket connection established', 'info');
        if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
        }
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message:', data);

            if (data.type === 'SYNC_UPDATE') {
                addLog(`Sync update: ${data.changes.length} changes detected`, 'info');
                refreshData();
            } else if (data.type === 'CONNECTED') {
                addLog(data.message, 'info');
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        updateStatus(false);
        addLog('WebSocket connection closed. Reconnecting...', 'warn');

        if (!reconnectInterval) {
            reconnectInterval = setInterval(() => {
                console.log('Attempting to reconnect...');
                connectWebSocket();
            }, 5000);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        addLog('WebSocket error occurred', 'error');
    };
}

function updateStatus(connected) {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');

    if (connected) {
        statusDot.classList.remove('disconnected');
        statusText.textContent = 'Connected';
    } else {
        statusDot.classList.add('disconnected');
        statusText.textContent = 'Disconnected';
    }
}

function addLog(message, level = 'info') {
    const logContainer = document.getElementById('sync-log');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${level}`;
    logEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> ${message}`;

    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;

    if (logContainer.children.length > 100) {
        logContainer.removeChild(logContainer.firstChild);
    }
}

async function fetchData() {
    try {
        const response = await fetch('/api/data');
        const result = await response.json();

        if (result.success) {
            displayDatabaseData(result.data);
        } else {
            addLog('Failed to fetch database data', 'error');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        addLog('Error fetching database data', 'error');
    }
}

async function fetchSheetData() {
    try {
        const response = await fetch('/api/sheet/data');
        const result = await response.json();

        if (result.success) {
            displaySheetData(result.data);
        } else {
            addLog('Failed to fetch sheet data', 'error');
        }
    } catch (error) {
        console.error('Error fetching sheet data:', error);
        addLog('Error fetching sheet data', 'error');
    }
}

function displayDatabaseData(data) {
    const container = document.getElementById('db-data');

    if (data.length === 0) {
        container.innerHTML = '<div class="empty-state">No data in database</div>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Age</th>
                    <th>City</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(row => {
        html += `
            <tr>
                <td>${row.row_id}</td>
                <td>${row.name}</td>
                <td>${row.email}</td>
                <td>${row.age}</td>
                <td>${row.city}</td>
                <td>
                    <div class="actions">
                        <button class="btn-small btn-danger" onclick="deleteRow('${row.row_id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function displaySheetData(data) {
    const container = document.getElementById('sheet-data');

    if (data.length === 0) {
        container.innerHTML = '<div class="empty-state">No data in sheet</div>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Age</th>
                    <th>City</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(row => {
        html += `
            <tr>
                <td>${row.row_id}</td>
                <td>${row.name}</td>
                <td>${row.email}</td>
                <td>${row.age}</td>
                <td>${row.city}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

async function manualSync() {
    addLog('Manual sync initiated...', 'info');

    try {
        const response = await fetch('/api/sync', {
            method: 'POST',
        });

        const result = await response.json();

        if (result.success) {
            addLog('Manual sync completed successfully', 'info');
            refreshData();
        } else {
            addLog('Manual sync failed: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error during manual sync:', error);
        addLog('Error during manual sync', 'error');
    }
}

async function resetSync() {
    if (!confirm('Are you sure you want to reset the sync state? This will force a full re-sync on the next cycle.')) {
        return;
    }

    addLog('Resetting sync state...', 'warn');

    try {
        const response = await fetch('/api/sync/reset', {
            method: 'POST',
        });

        const result = await response.json();

        if (result.success) {
            addLog('Sync state reset successfully', 'info');
        } else {
            addLog('Failed to reset sync state: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error resetting sync state:', error);
        addLog('Error resetting sync state', 'error');
    }
}

function refreshData() {
    addLog('Refreshing data...', 'info');
    fetchData();
    fetchSheetData();
}

function toggleAddForm() {
    const form = document.getElementById('add-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function addRow(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const age = document.getElementById('age').value;
    const city = document.getElementById('city').value;

    addLog(`Adding new row: ${name}`, 'info');

    try {
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, age, city }),
        });

        const result = await response.json();

        if (result.success) {
            addLog('Row added successfully', 'info');
            toggleAddForm();
            document.getElementById('name').value = '';
            document.getElementById('email').value = '';
            document.getElementById('age').value = '';
            document.getElementById('city').value = '';
            refreshData();
        } else {
            addLog('Failed to add row: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error adding row:', error);
        addLog('Error adding row', 'error');
    }
}

async function deleteRow(rowId) {
    if (!confirm(`Are you sure you want to delete ${rowId}?`)) {
        return;
    }

    addLog(`Deleting row: ${rowId}`, 'warn');

    try {
        const response = await fetch(`/api/data/${rowId}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
            addLog('Row deleted successfully', 'info');
            refreshData();
        } else {
            addLog('Failed to delete row: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error deleting row:', error);
        addLog('Error deleting row', 'error');
    }
}

connectWebSocket();
refreshData();

setInterval(refreshData, 10000);

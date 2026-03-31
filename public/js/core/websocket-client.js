/**
 * WebSocket Client for Real-Time Updates
 */

// Initialize Socket.IO connection
const socket = io('http://localhost:3000');

// Connection status
socket.on('connect', () => {
    console.log('✅ WebSocket connected:', socket.id);

    // Join current transformer room if viewing one
    const currentWO = getCurrentWorkOrder();
    if (currentWO) {
        socket.emit('join:transformer', currentWO);
        console.log('📍 Joined transformer room:', currentWO);
    }
});

socket.on('disconnect', () => {
    console.log('❌ WebSocket disconnected');
});

socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
});

/**
 * Listen for checklist updates
 */
socket.on('checklist:updated', (data) => {
    console.log('📝 Checklist updated:', data);

    // Show notification
    showRealtimeNotification({
        type: 'update',
        message: `${data.user || 'Someone'} updated a checklist item`,
        data: data
    });

    // Refresh the specific row
    if (data.rowId) {
        refreshChecklistRow(data.rowId);
    }
});

/**
 * Listen for lock events
 */
socket.on('checklist:locked', (data) => {
    console.log('🔒 Row locked:', data);

    showRealtimeNotification({
        type: 'lock',
        message: `${data.lockedBy || 'Someone'} locked a row`,
        data: data
    });

    if (data.rowId) {
        updateRowLockStatus(data.rowId, true, data.lockedBy);
    }
});

/**
 * Listen for unlock events
 */
socket.on('checklist:unlocked', (data) => {
    console.log('🔓 Row unlocked:', data);

    showRealtimeNotification({
        type: 'unlock',
        message: `${data.unlockedBy || 'Someone'} unlocked a row`,
        data: data
    });

    if (data.rowId) {
        updateRowLockStatus(data.rowId, false);
    }
});

/**
 * Listen for typing indicators
 */
socket.on('user:typing', (data) => {
    console.log('⌨️ User typing:', data);
    showTypingIndicator(data.user, data.field);
});

/**
 * Listen for notifications
 */
socket.on('notification', (data) => {
    console.log('🔔 Notification:', data);
    showRealtimeNotification(data);
});

/**
 * Broadcast checklist update
 */
function broadcastChecklistUpdate(rowId, actualValue) {
    const currentWO = getCurrentWorkOrder();
    if (!currentWO) return;

    socket.emit('checklist:update', {
        wo: currentWO,
        rowId: rowId,
        actualValue: actualValue,
        user: currentUser?.name || 'Unknown',
        timestamp: new Date().toISOString()
    });
}

/**
 * Broadcast lock event
 */
function broadcastLock(rowId, reason) {
    const currentWO = getCurrentWorkOrder();
    if (!currentWO) return;

    socket.emit('checklist:lock', {
        wo: currentWO,
        rowId: rowId,
        lockedBy: currentUser?.name || 'Unknown',
        reason: reason,
        timestamp: new Date().toISOString()
    });
}

/**
 * Broadcast unlock event
 */
function broadcastUnlock(rowId) {
    const currentWO = getCurrentWorkOrder();
    if (!currentWO) return;

    socket.emit('checklist:unlock', {
        wo: currentWO,
        rowId: rowId,
        unlockedBy: currentUser?.name || 'Unknown',
        timestamp: new Date().toISOString()
    });
}

/**
 * Show real-time notification
 */
function showRealtimeNotification(notification) {
    const container = document.getElementById('realtime-notifications');
    if (!container) {
        createNotificationContainer();
    }

    const notifEl = document.createElement('div');
    notifEl.className = `realtime-notification ${notification.type}`;

    const icon = {
        'update': '📝',
        'lock': '🔒',
        'unlock': '🔓',
        'info': 'ℹ️',
        'warning': '⚠️'
    }[notification.type] || '🔔';

    notifEl.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${notification.message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;

    document.getElementById('realtime-notifications').appendChild(notifEl);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        notifEl.style.opacity = '0';
        setTimeout(() => notifEl.remove(), 300);
    }, 5000);
}

/**
 * Create notification container
 */
function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'realtime-notifications';
    container.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 10000;
        max-width: 350px;
    `;
    document.body.appendChild(container);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .realtime-notification {
            background: white;
            border-left: 4px solid #4472C4;
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
            transition: opacity 0.3s;
        }
        
        .realtime-notification.lock {
            border-left-color: #dc3545;
        }
        
        .realtime-notification.unlock {
            border-left-color: #28a745;
        }
        
        .notification-icon {
            font-size: 20px;
        }
        
        .notification-message {
            flex: 1;
            font-size: 14px;
        }
        
        .notification-close {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 24px;
            height: 24px;
        }
        
        .notification-close:hover {
            color: #333;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Refresh checklist row
 */
async function refreshChecklistRow(rowId) {
    try {
        const currentWO = getCurrentWorkOrder();
        const currentStage = getCurrentStage();

        if (!currentWO || !currentStage) return;

        // Reload checklist data
        const response = await apiCall(`/checklist/${currentStage}/${currentWO}`);
        const items = Array.isArray(response) ? response : (response.data || []);

        // Find and update the specific row
        const item = items.find(i => i.rowId === rowId);
        if (item) {
            updateRowInDOM(item);
        }
    } catch (error) {
        console.error('Error refreshing row:', error);
    }
}

/**
 * Update row lock status in DOM
 */
function updateRowLockStatus(rowId, isLocked, lockedBy) {
    const row = document.querySelector(`[data-row-id="${rowId}"]`);
    if (!row) return;

    const lockBtn = row.querySelector('.lock-btn');
    const unlockBtn = row.querySelector('.unlock-btn');
    const inputs = row.querySelectorAll('input, textarea, select');

    if (isLocked) {
        row.classList.add('locked-row');
        if (lockBtn) lockBtn.style.display = 'none';
        if (unlockBtn) unlockBtn.style.display = 'inline-block';
        inputs.forEach(input => input.disabled = true);

        // Show locked by indicator
        const lockedIndicator = row.querySelector('.locked-by') || document.createElement('span');
        lockedIndicator.className = 'locked-by';
        lockedIndicator.textContent = `🔒 Locked by ${lockedBy}`;
        lockedIndicator.style.cssText = 'color: #dc3545; font-size: 12px; margin-left: 10px;';
        if (!row.querySelector('.locked-by')) {
            row.querySelector('.row-actions')?.appendChild(lockedIndicator);
        }
    } else {
        row.classList.remove('locked-row');
        if (lockBtn) lockBtn.style.display = 'inline-block';
        if (unlockBtn) unlockBtn.style.display = 'none';
        inputs.forEach(input => input.disabled = false);

        // Remove locked indicator
        const lockedIndicator = row.querySelector('.locked-by');
        if (lockedIndicator) lockedIndicator.remove();
    }
}

/**
 * Get current work order from URL or state
 */
function getCurrentWorkOrder() {
    // Try to get from global state
    if (window.currentWO) return window.currentWO;

    // Try to get from URL
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('wo');
}

/**
 * Get current stage from URL or state
 */
function getCurrentStage() {
    if (window.currentStage) return window.currentStage;

    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('stage');
}

/**
 * Show typing indicator
 */
let typingTimeout;
function showTypingIndicator(user, field) {
    const indicator = document.getElementById('typing-indicator') || createTypingIndicator();
    indicator.textContent = `${user} is typing in ${field}...`;
    indicator.style.display = 'block';

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        indicator.style.display = 'none';
    }, 3000);
}

function createTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'typing-indicator';
    indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #f8f9fa;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        color: #666;
        display: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(indicator);
    return indicator;
}

// Export broadcast helpers for feature scripts (e.g. checklist)
window.broadcastChecklistUpdate = broadcastChecklistUpdate;
window.broadcastLock = broadcastLock;
window.broadcastUnlock = broadcastUnlock;

console.log('🔄 WebSocket client initialized');

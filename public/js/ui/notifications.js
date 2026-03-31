/* ===============================
   🔔 NOTIFICATION CENTER
   Real-time alerts and notifications
================================ */

let notifications = [];
let unreadCount = 0;
let lastNotifiedItems = new Set();

// Notification types with styling
const NOTIFICATION_TYPES = {
    QA_PENDING: { icon: '⚠️', color: 'var(--warning)', label: 'QA Pending' },
    DELAY: { icon: '⏰', color: 'var(--danger)', label: 'Delay Warning' },
    DEVIATION: { icon: '📊', color: 'var(--info)', label: 'Value Deviation' },
    COMPLETION: { icon: '✅', color: 'var(--success)', label: 'Completed' },
    SYSTEM: { icon: 'ℹ️', color: 'var(--primary)', label: 'System' }
};

/* ===============================
   CORE NOTIFICATION FUNCTIONS
================================ */

/**
 * Add a new notification
 */
function addNotification(type, title, message, data = {}) {
    const notification = {
        id: Date.now().toString(),
        type,
        title,
        message,
        data,
        timestamp: new Date().toISOString(),
        read: false
    };

    notifications.unshift(notification);
    unreadCount++;

    // Update UI
    updateNotificationBadge();
    renderNotificationCenter();

    // Show toast
    showToast(type, title, message);

    // Save to localStorage
    saveNotifications();

    console.log(`🔔 New notification: ${title}`);

    return notification;
}

/**
 * Mark notification as read
 */
function markAsRead(notificationId) {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
        notification.read = true;
        unreadCount = Math.max(0, unreadCount - 1);
        updateNotificationBadge();
        renderNotificationCenter();
        saveNotifications();
    }
}

/**
 * Mark all as read
 */
function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    unreadCount = 0;
    updateNotificationBadge();
    renderNotificationCenter();
    saveNotifications();
}

/**
 * Clear all notifications
 */
async function clearAllNotifications() {
    const ok = await Modal.confirm({
        title: 'Clear All Notifications',
        message: 'Are you sure you want to clear all notifications? This cannot be undone.',
        intent: 'danger',
        confirmText: 'Clear All',
        icon: '🗑️'
    });
    if (ok) {
        notifications = [];
        unreadCount = 0;
        updateNotificationBadge();
        renderNotificationCenter();
        saveNotifications();
    }
}

/**
 * Update notification badge counter
 */
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';

        // Add pulse animation for new notifications
        if (unreadCount > 0) {
            badge.classList.add('pulse');
        } else {
            badge.classList.remove('pulse');
        }
    }
}

/**
 * Render notification center panel
 */
function renderNotificationCenter() {
    const container = document.getElementById('notificationList');
    if (!container) return;

    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="notification-empty">
                <span style="font-size: 48px; opacity: 0.3;">🔔</span>
                <p style="color: var(--text-secondary); margin-top: 12px;">No notifications</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notifications.map((n, index) => {
        const typeConfig = NOTIFICATION_TYPES[n.type] || NOTIFICATION_TYPES.SYSTEM;
        return `
            <div class="notification-item ${n.read ? 'read' : 'unread'}" 
                 style="--item-index: ${index}"
                 onclick="markAsRead('${n.id}')">
                <div class="notification-icon" style="color: ${typeConfig.color}">
                    ${typeConfig.icon}
                </div>
                <div class="notification-content">
                    <h4>${n.title}</h4>
                    <p>${n.message}</p>
                    <span class="notification-time">
                        ${formatTimeAgo(n.timestamp)}
                    </span>
                </div>
                ${!n.read ? '<div class="notification-dot"></div>' : ''}
            </div>
        `;
    }).join('');
}

/**
 * Toggle notification panel visibility
 */
function toggleNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        const isShowing = panel.classList.contains('show');
        panel.classList.toggle('show');

        // Close panel when clicking outside
        if (!isShowing) {
            setTimeout(() => {
                document.addEventListener('click', closeNotificationPanelOutside);
            }, 100);
        } else {
            document.removeEventListener('click', closeNotificationPanelOutside);
        }
    }
}

/**
 * Close panel when clicking outside
 */
function closeNotificationPanelOutside(event) {
    const panel = document.getElementById('notificationPanel');
    const bell = document.querySelector('.notification-bell');

    if (panel && !panel.contains(event.target) && !bell.contains(event.target)) {
        panel.classList.remove('show');
        document.removeEventListener('click', closeNotificationPanelOutside);
    }
}

/* ===============================
   TOAST NOTIFICATIONS
================================ */

/**
 * Show toast notification — delegates to the global Toast system if available
 */
function showToast(type, title, message, duration = 5000) {
    // If the premium Toast system is loaded, delegate to it
    if (window.Toast) {
        const typeMap = {
            COMPLETION: 'success',
            DELAY: 'error',
            QA_PENDING: 'warning',
            DEVIATION: 'warning',
            SYSTEM: 'info'
        };
        const toastType = typeMap[type] || 'info';
        window.Toast[toastType](message, { title, duration });
        return;
    }

    // Legacy fallback (plain DOM toast)
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const typeConfig = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.SYSTEM;
    toast.innerHTML = `
        <div class="toast-icon">${typeConfig.icon}</div>
        <div class="toast-content"><h4>${title}</h4><p>${message}</p></div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, duration);
}

/**
 * Quick toast helpers — bridged to new Toast system
 */
function toastSuccess(message, title = 'Success') {
    if (window.Toast) { window.Toast.success(message, { title }); return; }
    showToast('COMPLETION', title, message);
}

function toastError(message, title = 'Error') {
    if (window.Toast) { window.Toast.error(message, { title }); return; }
    showToast('DELAY', title, message);
}

function toastWarning(message, title = 'Warning') {
    if (window.Toast) { window.Toast.warning(message, { title }); return; }
    showToast('QA_PENDING', title, message);
}

function toastInfo(message, title = 'Info') {
    if (window.Toast) { window.Toast.info(message, { title }); return; }
    showToast('SYSTEM', title, message);
}

/* ===============================
   ALERT MONITORING
================================ */

/**
 * Check for QA pending items
 */
async function checkQAPending() {
    try {
        const response = await apiCall('/checklist/pending-qa');
        const pending = response.data || response || [];

        if (pending.length > 0) {
            // Filter out items we've already notified about in this session
            const newItems = pending.filter(item => !lastNotifiedItems.has(item.rowId || item.id));

            if (newItems.length > 0) {
                const title = newItems.length === 1
                    ? 'QA Review Required'
                    : `${newItems.length} Items Awaiting QA`;

                const message = newItems.length === 1
                    ? `Item ${newItems[0].itemNumber} for WO ${newItems[0].wo} is ready for sign-off.`
                    : `${newItems.length} manufacturing items need quality approval.`;

                addNotification(
                    'QA_PENDING',
                    title,
                    message,
                    { count: newItems.length, items: newItems }
                );

                // Add to notified set
                newItems.forEach(item => lastNotifiedItems.add(item.rowId || item.id));
            }
        }
    } catch (error) {
        console.error('Error checking QA pending:', error);
    }
}

let lastNotifiedDelays = new Set();

/**
 * Check for delayed transformers
 */
async function checkDelays() {
    try {
        const response = await apiCall('/transformers/delayed');
        const delayed = response.data || response || [];

        if (delayed.length > 0) {
            // Filter out transformers we've already notified about
            const newDelays = delayed.filter(t => !lastNotifiedDelays.has(t.wo));

            if (newDelays.length > 0) {
                newDelays.forEach(t => {
                    addNotification(
                        'DELAY',
                        `Transformer ${t.wo} Delayed`,
                        'Item has been in production for over 14 days and is still in early stages.',
                        { transformer: t }
                    );
                    lastNotifiedDelays.add(t.wo);
                });
            }
        }
    } catch (error) {
        console.error('Error checking delays:', error);
    }
}

/**
 * Check for value deviations
 */
async function checkDeviations() {
    // Simulated check for now as discussed in plan
    const hasDeviation = Math.random() > 0.98; // Rare chance for demo

    if (hasDeviation) {
        addNotification(
            'DEVIATION',
            'Value Deviation Alert',
            'Significant deviation detected in recent winding measurements.',
            { severity: 'high' }
        );
    }
}

/**
 * Run all alert checks
 */
async function runAlertChecks() {
    console.log('🔍 Running alert checks...');
    await checkQAPending();
    await checkDelays();
    await checkDeviations();
}

/**
 * Start real-time monitoring
 */
function startAlertMonitoring() {
    console.log('🚀 Starting alert monitoring (30s interval)');

    // Run immediately
    runAlertChecks();

    // Then every 30 seconds
    setInterval(runAlertChecks, 30000);
}

/* ===============================
   UTILITY FUNCTIONS
================================ */

/**
 * Format timestamp as "X ago"
 */
function formatTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Save notifications to localStorage
 */
function saveNotifications() {
    try {
        localStorage.setItem('notifications', JSON.stringify(notifications));
        localStorage.setItem('unreadCount', unreadCount.toString());
    } catch (error) {
        console.error('Error saving notifications:', error);
    }
}

/**
 * Load notifications from localStorage
 */
function loadNotifications() {
    try {
        const saved = localStorage.getItem('notifications');
        if (saved) {
            notifications = JSON.parse(saved);
            unreadCount = parseInt(localStorage.getItem('unreadCount') || '0');
            updateNotificationBadge();
            renderNotificationCenter();
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

/* ===============================
   INITIALIZATION
================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Load saved notifications
    loadNotifications();

    // Start monitoring after 5 seconds
    setTimeout(() => {
        startAlertMonitoring();
    }, 5000);
});

// Export to window
window.addNotification = addNotification;
window.markAsRead = markAsRead;
window.markAllAsRead = markAllAsRead;
window.clearAllNotifications = clearAllNotifications;
window.toggleNotificationPanel = toggleNotificationPanel;
window.showToast = showToast;
window.toastSuccess = toastSuccess;
window.toastError = toastError;
window.toastWarning = toastWarning;
window.toastInfo = toastInfo;

console.log('✅ Notification system loaded');

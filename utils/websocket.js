const logger = require('./logger');

let io = null;

/**
 * Initialize WebSocket
 * @param {Object} socketIO - Socket.IO instance
 */
function initWebSocket(socketIO) {
    io = socketIO;

    io.on('connection', (socket) => {
        logger.info('WebSocket client connected', { socketId: socket.id });

        // Join transformer room
        socket.on('join:transformer', (woNumber) => {
            socket.join(`transformer:${woNumber}`);
            logger.debug('Client joined transformer room', { socketId: socket.id, wo: woNumber });
        });

        // Leave transformer room
        socket.on('leave:transformer', (woNumber) => {
            socket.leave(`transformer:${woNumber}`);
            logger.debug('Client left transformer room', { socketId: socket.id, wo: woNumber });
        });

        // Checklist update broadcast
        socket.on('checklist:update', (data) => {
            socket.to(`transformer:${data.wo}`).emit('checklist:updated', {
                ...data,
                timestamp: new Date().toISOString()
            });
            logger.debug('Checklist update broadcasted', { wo: data.wo, rowId: data.rowId });
        });

        // Lock/unlock broadcast
        socket.on('checklist:lock', (data) => {
            socket.to(`transformer:${data.wo}`).emit('checklist:locked', {
                ...data,
                timestamp: new Date().toISOString()
            });
            logger.debug('Lock event broadcasted', { wo: data.wo, rowId: data.rowId });
        });

        socket.on('checklist:unlock', (data) => {
            socket.to(`transformer:${data.wo}`).emit('checklist:unlocked', {
                ...data,
                timestamp: new Date().toISOString()
            });
            logger.debug('Unlock event broadcasted', { wo: data.wo, rowId: data.rowId });
        });

        // User typing indicator
        socket.on('typing', (data) => {
            socket.to(`transformer:${data.wo}`).emit('user:typing', {
                user: data.user,
                field: data.field,
                timestamp: new Date().toISOString()
            });
        });

        // User presence
        socket.on('user:online', (data) => {
            socket.broadcast.emit('user:status', {
                userId: data.userId,
                status: 'online',
                timestamp: new Date().toISOString()
            });
        });

        // Disconnect
        socket.on('disconnect', () => {
            logger.info('WebSocket client disconnected', { socketId: socket.id });
        });
    });

    logger.info('WebSocket initialized successfully');
}

/**
 * Broadcast checklist update to all clients in transformer room
 * @param {string} wo - Work order number
 * @param {Object} data - Update data
 */
function broadcastChecklistUpdate(wo, data) {
    if (io) {
        io.to(`transformer:${wo}`).emit('checklist:updated', {
            ...data,
            timestamp: new Date().toISOString()
        });
        logger.debug('Server broadcasted checklist update', { wo, rowId: data.rowId });
    }
}

/**
 * Broadcast lock event
 * @param {string} wo - Work order number
 * @param {Object} data - Lock data
 */
function broadcastLock(wo, data) {
    if (io) {
        io.to(`transformer:${wo}`).emit('checklist:locked', {
            ...data,
            timestamp: new Date().toISOString()
        });
        logger.debug('Server broadcasted lock event', { wo, rowId: data.rowId });
    }
}

/**
 * Broadcast unlock event
 * @param {string} wo - Work order number
 * @param {Object} data - Unlock data
 */
function broadcastUnlock(wo, data) {
    if (io) {
        io.to(`transformer:${wo}`).emit('checklist:unlocked', {
            ...data,
            timestamp: new Date().toISOString()
        });
        logger.debug('Server broadcasted unlock event', { wo, rowId: data.rowId });
    }
}

/**
 * Broadcast notification to specific user
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 */
function sendNotification(userId, notification) {
    if (io) {
        io.emit('notification', {
            userId,
            ...notification,
            timestamp: new Date().toISOString()
        });
        logger.debug('Notification sent', { userId, type: notification.type });
    }
}

/**
 * Broadcast to all connected clients
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
function broadcastToAll(event, data) {
    if (io) {
        io.emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
        logger.debug('Broadcasted to all clients', { event });
    }
}

module.exports = {
    initWebSocket,
    broadcastChecklistUpdate,
    broadcastLock,
    broadcastUnlock,
    sendNotification,
    broadcastToAll
};

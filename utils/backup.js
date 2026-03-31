const cron = require('node-cron');
const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = 7; // Keep last 7 days

/**
 * Create a backup of all data files
 * @returns {Promise<string>} Backup directory path
 */
async function createBackup() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(BACKUP_DIR, timestamp);

        // Create backup directory
        await fs.ensureDir(backupPath);

        // Copy all data files
        await fs.copy(DATA_DIR, backupPath);

        logger.info('Backup created successfully', { path: backupPath });
        return backupPath;
    } catch (error) {
        logger.logError(error, { context: 'createBackup' });
        throw error;
    }
}

/**
 * Clean old backups (keep only MAX_BACKUPS)
 */
async function cleanOldBackups() {
    try {
        const backups = await fs.readdir(BACKUP_DIR);

        if (backups.length <= MAX_BACKUPS) {
            return;
        }

        // Sort by date (oldest first)
        const sortedBackups = backups
            .map(name => ({
                name,
                path: path.join(BACKUP_DIR, name),
                time: fs.statSync(path.join(BACKUP_DIR, name)).mtime.getTime()
            }))
            .sort((a, b) => a.time - b.time);

        // Delete oldest backups
        const toDelete = sortedBackups.slice(0, sortedBackups.length - MAX_BACKUPS);

        for (const backup of toDelete) {
            await fs.remove(backup.path);
            logger.info('Old backup deleted', { path: backup.name });
        }

        logger.info(`Cleaned ${toDelete.length} old backups`);
    } catch (error) {
        logger.logError(error, { context: 'cleanOldBackups' });
    }
}

/**
 * Restore from a backup
 * @param {string} backupName - Backup directory name
 */
async function restoreBackup(backupName) {
    try {
        const backupPath = path.join(BACKUP_DIR, backupName);

        if (!await fs.pathExists(backupPath)) {
            throw new Error(`Backup not found: ${backupName}`);
        }

        // Create a backup of current data before restoring
        await createBackup();

        // Restore from backup
        await fs.copy(backupPath, DATA_DIR, { overwrite: true });

        logger.info('Backup restored successfully', { backup: backupName });
        return true;
    } catch (error) {
        logger.logError(error, { context: 'restoreBackup', backup: backupName });
        throw error;
    }
}

/**
 * List all available backups
 * @returns {Promise<Array>} List of backups with metadata
 */
async function listBackups() {
    try {
        await fs.ensureDir(BACKUP_DIR);
        const backups = await fs.readdir(BACKUP_DIR);

        const backupList = await Promise.all(
            backups.map(async (name) => {
                const backupPath = path.join(BACKUP_DIR, name);
                const stats = await fs.stat(backupPath);
                const size = await getDirectorySize(backupPath);

                return {
                    name,
                    date: stats.mtime,
                    size: formatBytes(size),
                    path: backupPath
                };
            })
        );

        return backupList.sort((a, b) => b.date - a.date);
    } catch (error) {
        logger.logError(error, { context: 'listBackups' });
        return [];
    }
}

/**
 * Get directory size recursively
 * @param {string} dirPath - Directory path
 * @returns {Promise<number>} Size in bytes
 */
async function getDirectorySize(dirPath) {
    let size = 0;
    const files = await fs.readdir(dirPath);

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
            size += await getDirectorySize(filePath);
        } else {
            size += stats.size;
        }
    }

    return size;
}

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
    if (bytes === 0) {
        return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Initialize automated backups
 */
function initAutomatedBackups() {
    // Ensure backup directory exists
    fs.ensureDirSync(BACKUP_DIR);

    // Schedule daily backup at 2 AM
    cron.schedule('0 2 * * *', async () => {
        logger.info('Starting scheduled backup...');
        await createBackup();
        await cleanOldBackups();
        logger.info('Scheduled backup completed');
    });

    logger.info('Automated backups initialized (Daily at 2 AM)');
}

module.exports = {
    createBackup,
    restoreBackup,
    listBackups,
    cleanOldBackups,
    initAutomatedBackups
};

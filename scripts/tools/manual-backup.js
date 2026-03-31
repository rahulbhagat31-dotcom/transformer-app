const { createBackup, listBackups } = require('../utils/backup');
const logger = require('../utils/logger');

async function main() {
    try {
        console.log('🔄 Creating manual backup...\n');

        const backupPath = await createBackup();
        console.log(`✅ Backup created: ${backupPath}\n`);

        console.log('📦 Available backups:');
        const backups = await listBackups();
        backups.forEach((backup, index) => {
            console.log(`  ${index + 1}. ${backup.name} (${backup.size}) - ${backup.date.toLocaleString()}`);
        });

        logger.info('Manual backup completed');
    } catch (error) {
        console.error('❌ Backup failed:', error.message);
        logger.logError(error);
        process.exit(1);
    }
}

main();

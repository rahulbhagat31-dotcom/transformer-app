/**
 * Multi-Customer Migration Script
 * Migrates existing data to multi-customer structure
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Backup directory
const BACKUP_DIR = path.join(DATA_DIR, 'pre-multi-customer-backup');

console.log('🚀 Starting Multi-Customer Migration...\n');

// Step 1: Create backup
console.log('📦 Step 1: Creating backup...');
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const filesToBackup = ['transformers.json', 'checklists.json', 'boms.json', 'auditLogs.json'];

filesToBackup.forEach(file => {
    const sourcePath = path.join(DATA_DIR, file);
    const backupPath = path.join(BACKUP_DIR, file);

    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, backupPath);
        console.log(`   ✅ Backed up ${file}`);
    } else {
        console.log(`   ⚠️  ${file} not found, skipping`);
    }
});

console.log('\n📝 Step 2: Migrating transformers...');
const transformersPath = path.join(DATA_DIR, 'transformers.json');
if (fs.existsSync(transformersPath)) {
    const transformers = JSON.parse(fs.readFileSync(transformersPath, 'utf8'));
    let migratedCount = 0;

    transformers.forEach(transformer => {
        if (!transformer.customerId) {
            transformer.customerId = 'cust_uptcl'; // Default to UPTCL
            migratedCount++;
        }
    });

    fs.writeFileSync(transformersPath, JSON.stringify(transformers, null, 2));
    console.log(`   ✅ Migrated ${migratedCount} transformers to UPTCL`);
} else {
    console.log('   ⚠️  transformers.json not found');
}

console.log('\n📝 Step 3: Migrating checklists...');
const checklistsPath = path.join(DATA_DIR, 'checklists.json');
if (fs.existsSync(checklistsPath)) {
    const checklists = JSON.parse(fs.readFileSync(checklistsPath, 'utf8'));
    let migratedCount = 0;

    checklists.forEach(checklist => {
        if (!checklist.customerId) {
            checklist.customerId = 'cust_uptcl';
            migratedCount++;
        }
    });

    fs.writeFileSync(checklistsPath, JSON.stringify(checklists, null, 2));
    console.log(`   ✅ Migrated ${migratedCount} checklists to UPTCL`);
} else {
    console.log('   ⚠️  checklists.json not found');
}

console.log('\n📝 Step 4: Migrating BOMs...');
const bomsPath = path.join(DATA_DIR, 'boms.json');
if (fs.existsSync(bomsPath)) {
    const boms = JSON.parse(fs.readFileSync(bomsPath, 'utf8'));
    let migratedCount = 0;

    boms.forEach(bom => {
        if (!bom.customerId) {
            bom.customerId = 'cust_uptcl';
            migratedCount++;
        }
    });

    fs.writeFileSync(bomsPath, JSON.stringify(boms, null, 2));
    console.log(`   ✅ Migrated ${migratedCount} BOMs to UPTCL`);
} else {
    console.log('   ⚠️  boms.json not found');
}

console.log('\n📝 Step 5: Migrating audit logs...');
const auditLogsPath = path.join(DATA_DIR, 'auditLogs.json');
if (fs.existsSync(auditLogsPath)) {
    const auditLogs = JSON.parse(fs.readFileSync(auditLogsPath, 'utf8'));
    let migratedCount = 0;

    auditLogs.forEach(log => {
        if (!log.customerId) {
            log.customerId = 'cust_uptcl';
            migratedCount++;
        }
    });

    fs.writeFileSync(auditLogsPath, JSON.stringify(auditLogs, null, 2));
    console.log(`   ✅ Migrated ${migratedCount} audit logs to UPTCL`);
} else {
    console.log('   ⚠️  auditLogs.json not found');
}

console.log('\n✅ Migration Complete!');
console.log('\n📊 Summary:');
console.log('   - All existing data assigned to UPTCL (cust_uptcl)');
console.log('   - Backups created in:', BACKUP_DIR);
console.log('   - New customers can now be added without affecting existing data');
console.log('\n🎯 Next Steps:');
console.log('   1. Restart the server');
console.log('   2. Login with multi-customer credentials:');
console.log('      - admin@uptcl (password: admin123)');
console.log('      - admin@powergrid (password: admin123)');
console.log('      - admin@ntpc (password: admin123)');
console.log('   3. Test data isolation between customers');
console.log('\n✨ Multi-customer support is now active!\n');

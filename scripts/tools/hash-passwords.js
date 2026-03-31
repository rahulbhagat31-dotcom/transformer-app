const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function hashPasswords() {
    const usersPath = path.join(__dirname, 'data', 'users.json');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

    console.log('🔐 Hashing passwords...\n');

    for (const user of users) {
        if (!user.password.startsWith('$2b$')) { // Not already hashed
            const originalPassword = user.password;
            user.password = await bcrypt.hash(originalPassword, 10);
            console.log(`✅ ${user.username}: ${originalPassword} → [HASHED]`);
        } else {
            console.log(`⏭️  ${user.username}: Already hashed`);
        }
    }

    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    console.log('\n✅ All passwords hashed successfully!');
}

hashPasswords().catch(console.error);

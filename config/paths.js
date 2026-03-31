const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

module.exports = {
    DATA_DIR,
    FILES: {
        // All data is now in SQLite
        // These keys are kept empty or removed as they are no longer used by the application
        SQLITE_DB: path.join(DATA_DIR, 'transformer.db')
    }
};

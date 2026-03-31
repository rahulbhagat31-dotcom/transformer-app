const fs = require('fs');
const path = require('path');

// Helper to get absolute path to data files
const getPath = (filename) => path.join(__dirname, '..', 'data', filename);

const readJSON = (filename) => {
    try {
        const data = fs.readFileSync(getPath(filename), 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading ${filename}:`, err);
        return [];
    }
};

const writeJSON = (filename, data) => {
    try {
        fs.writeFileSync(getPath(filename), JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error(`Error writing ${filename}:`, err);
        return false;
    }
};

module.exports = { readJSON, writeJSON };
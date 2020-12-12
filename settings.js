const fs = require('fs');
const path = require('path');

const settingsPath = path.resolve('./data/config.json');

const settingsExist = () => {
    return fs.existsSync(settingsPath);
}

const createSkeleton = () => {
    fs.writeFileSync(settingsPath, JSON.stringify({
        port: 5000,
        influx: {
            host: 'localhost',
            port: 8086,
            database: 'laundry',
        }
    }, null, 2));
};

const getSettings = async () => {
    return JSON.parse(fs.readFileSync(settingsPath));
};

module.exports = {
    exist: settingsExist,
    load: getSettings,
    createSkeleton
};
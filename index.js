const express = require('express');
const bodyParser = require('body-parser');
const ActivityWatcher = require('./activityWatcher.js');
const Influx = require('influx');
const settings = require('./settings.js');

console.log("Loading settings...");
if (!settings.exist()) {
    console.warn("No settings file found, creating skeleton...");
    settings.createSkeleton();
    console.log("Please change the settings skeleton to your liking and restart the app.");
    return;
}
const config = settings.load();
console.log("Successfully loaded settings");

const app = express();
app.use(bodyParser.json());
const port = config.port;

const db = new Influx.InfluxDB({
    ...config.influx,
    schema: [
        {
            measurement: 'washing_activity',
            fields: {
                activity: Influx.FieldType.FLOAT
            },
            tags: [
                'room',
                'machine'
            ]
        }
    ]
});

const watcher = new ActivityWatcher();
watcher.onUpdate = (update) => {
    const room = update.machine.split('-')[0];
    console.log(`[${new Date(update.time).toLocaleTimeString()} | ${update.machine} | ${update.activity}]`);
    db.writePoints([
        {
            measurement: 'washing_activity',
            tags: { room, machine: update.machine },
            fields: { activity: update.activity },
            timestamp: new Date(update.time)
        }
    ], {precision: 's'}).catch(err => {
        console.error(`Error saving data to InfluxDB! ${err.stack}`)
    });
};

const getBatteryStatus = headers => {
    if (headers["battery-status"]) {
        const status = JSON.parse(headers["battery-status"]);
        return `[${status.charging ? '+' : '-'}]${status.level}%`
    }
    else return "[?]"
}

app.get('/', (req, res) => {
    res.send("Laundry relay is working!");
});

app.post('/log', (req, res) => {
    let status = 200;
    try {
        const batteryStatus = getBatteryStatus(req.headers);
        console.log(`--- ${req.body.reader} | ${req.body.beacons.length} | ${new Date().toLocaleTimeString()} | ${batteryStatus} ---`);
        watcher.registerReading(req.body);
    }
    catch (error) {
        console.error(error);
        status = 500;
    }

    return res.status(status).send();
});

app.listen(port, () => {
    console.log("Relay running at http://localhost:" + port);
})
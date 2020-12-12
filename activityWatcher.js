
const minuteCoeff = 1000 * 60;

const getMinuteTimestamp = (timestamp) => (
    timestamp ?
        Math.round(timestamp / minuteCoeff) * minuteCoeff :
        Math.round(new Date().getTime() / minuteCoeff) * minuteCoeff
);

// this class aggregates beacon readings and converts them to usable, 
// minute-based activity data for each machine
// on a scale from 0-1
class ActivityWatcher {
    constructor() {
        this.time = new Date().getTime();
        this.machines = {};
    }

    registerReading(reading) {
        for (const beacon of reading.beacons) {
            const machine = `${beacon.ibeacon_data.major}-${beacon.ibeacon_data.minor}`
            const state = beacon.ibeacon_data.uuid.startsWith('00000000') ? 1 : 0;
            const minute = getMinuteTimestamp(beacon.last_seen);

            if (!this.machines.hasOwnProperty(machine)) {
                this.registerMachine(machine, state, minute);
            }
            // the current minute we were tracking is now over
            else if (minute > this.machines[machine].lastMinute) {
                const finalActivity = this.machines[machine].activity / this.machines[machine].count;

                // fire update with final activity rating for this minute
                if (this.onUpdate) {
                    this.onUpdate({
                        machine,
                        activity: finalActivity,
                        time: minute
                    });
                }

                // reset machine state for this new minute
                this.registerMachine(machine, state, minute);
            }
            else {
                this.machines[machine].activity += state;
                this.machines[machine].count++;
            }
        }
    }

    registerMachine(machine, state, minute) {
        this.machines[machine] = {
            lastMinute: minute,
            activity: state,
            count: 1
        };
    }
}

module.exports = ActivityWatcher
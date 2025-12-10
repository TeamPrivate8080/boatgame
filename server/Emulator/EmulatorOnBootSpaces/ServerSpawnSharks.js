const { Sharks } = require('../../ServerStoring');
const { EmulatorSpawnShark } = require('../EmulatorActions/Emu.SpawnShark')

function ServerSpawnSharks(io, v) {
    let idCounter = 1;

    for (let i = 0; i < v; i++) {
        while (Sharks[idCounter]) {
            idCounter++;
        }
        const SharkID = idCounter.toString();

        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * 2000;
        const SharkPosition = {
            x: Math.cos(angle) * radius,
            y: -2,
            z: Math.sin(angle) * radius
        };

        EmulatorSpawnShark(io, { SharkID, SharkPosition });

        idCounter++;
    }
}

module.exports = {
    ServerSpawnSharks
}
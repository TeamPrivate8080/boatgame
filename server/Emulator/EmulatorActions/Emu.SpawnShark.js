const { Sharks } = require("../../ServerStoring.js");

function EmulatorSpawnShark(io, payload) {
    let { SharkID, SharkPosition } = payload;

    let idCounter = 1;
    while (Sharks[SharkID]) {
        SharkID = idCounter.toString();
        idCounter++;
    }

    Sharks[SharkID] = {
        ObjectID: SharkID,
        ObjectData: {
            position: SharkPosition,
            rotY: 0,
        },
        ObjectGame: {
            health: {amount: 200, max: 200}
        }
    };

    io.emit('SpawnShark', {
        SharkPayload: Sharks[SharkID],
    });
}

module.exports = {
    EmulatorSpawnShark
}

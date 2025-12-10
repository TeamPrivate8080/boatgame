const { Players } = require('../../ServerStoring');

// sock, fleet, str island, boolan death
function EmulatorRemovePlayersFromFleet(Engine, fleet, hitIsland, bool) {
    for (const PlayerID in Players) {
        const player = Players[PlayerID];
        if (player.ObjectGame && player.ObjectGame.inship === fleet.ObjectID) {
            player.ObjectData.last_action = new Date();

            if (bool) player.GainedValues.deaths += 1;

            player.ObjectGame.docked = true;
            player.ObjectGame.inship = null;
            player.ObjectGame.island = hitIsland;

            player.ObjectData.position.x = fleet.ObjectData.position.x;
            player.ObjectData.position.z = fleet.ObjectData.position.z;

            Engine.emit('RemovePlayerFromFleet', player.ObjectID, fleet.ObjectID, hitIsland);
        }
    }
}

module.exports = {
    EmulatorRemovePlayersFromFleet
}
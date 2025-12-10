const { GetGameLeaderboardScores } = require('./GetDataClass.js');
const { Players, Fleets, Pumps } = require("./ServerStoring.js"); // Make sure Pumps is exported

function StartGLoop(io) {
    setInterval(() => {
        io.emit('leadscores', GetGameLeaderboardScores());
        io.emit('gs_data', {
            fleets: Object.values(Fleets).length,
            players: Object.values(Players).length
        });

        // extra income generations (xp, gold, factories)
        for (const PlayerID in Players) {
            const player = Players[PlayerID];
            if (!player) continue;

            player.GainedValues.xp += 1;
            player.ValueStates.gold.amount += 5;
            player.ValueStates.wood.amount += 1;

            const playerPumps = Pumps.filter(p => p.ownerId === PlayerID);
            if (playerPumps.length > 0) {
                const pumpIncome = 25 * playerPumps.length; // value * each user pump
                player.ValueStates.gold.amount += pumpIncome;
            }

            io.to(player.ObjectID).emit('UValues', {
                gold: player.ValueStates.gold.amount,
                wood: player.ValueStates.wood.amount
            });
        }

    }, 1000);
}

module.exports = {
    StartGLoop
};

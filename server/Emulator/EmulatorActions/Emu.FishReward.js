const { EmulatorPackets } = require('../NetCode/Emu.Packets.js');
const { ConfigCache } = require('../../ConfigLoader.js');

function EmulatorThrowFishReward(io, peer, payload) {
    const { player, id } = payload;

    const ThisPackets = {
        VALUEUPDATES: EmulatorPackets[2],
        REWARD: EmulatorPackets[3]
    }

    io.emit(ThisPackets.REWARD, id);

    player.ObjectGame.FishCatchTime = null;

    setTimeout(() => {
        player.ObjectGame.fishing = false;
        player.ValueStates.gold.amount += Math.floor(Math.random() * (150 - 75 + 1)) + 75;

            io.to(player.ObjectID).emit(ThisPackets.VALUEUPDATES, {
        gold: player.ValueStates.gold.amount,
        wood: player.ValueStates.wood.amount
    });

    player.GainedValues.xp += Math.floor(Math.random() * (150 - 75 + 1)) + 75;
    }, 2000)



    if (ConfigCache.Server.Debug)
        console.log(`(SERVER) Player ${id} caught fish and got 80 gold`);
}

module.exports = {
    EmulatorThrowFishReward
}
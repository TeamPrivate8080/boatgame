const { Players } = require("../../ServerStoring.js");
const { EmulatorPackets } = require('../NetCode/Emu.Packets.js');

// old
function EmulatorUpdateGold(io, peer, amount) {
    const Exchange = amount;
    const PlayerID = Players[peer.id].ObjectID;
    const ThisPacket = EmulatorPackets[2];

    if (Exchange && PlayerID) {
        Players[PlayerID].ValueStates.gold.amount += amount;
    };

    io.to(peer.id).emit('UValues', {
        gold: Players[PlayerID].ValueStates.gold.amount,
        wood: Players[PlayerID].ValueStates.wood.amount
    });
}

module.exports = {
    EmulatorUpdateGold
}
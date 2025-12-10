const { Players, Fleets, ShopVehicles } = require("../../ServerStoring.js");
const { EmulatorPackets } = require('../NetCode/Emu.Packets.js');

function EmulatorAddPlayerToShip(io, peer, ClientPayload) {
    const ThisPacket = EmulatorPackets[0];
    const { ShipID, PlayerID } = ClientPayload;

    if (Fleets[ShipID] && Players[PlayerID]) {
        const player = Players[PlayerID];
        const ship = Fleets[ShipID];

        player.ObjectGame.inship = ShipID;
        player.ObjectGame.groupid = ShipID;

        io.emit(ThisPacket, PlayerID, ShipID);

        let shipImg = 't1';
        if (ship.ObjectGame?.model) {
            const modelKey = Object.keys(ShopVehicles).find(
                k => ShopVehicles[k].name === ship.ObjectGame.model
            );
            if (modelKey) shipImg = 't' + ShopVehicles[modelKey].id;
        }

        const crewMembers = Object.values(Players)
            .filter(p => p.ObjectGame?.groupid === ShipID)
            .map(p => p.ObjectID);

        const payload = {
            img: shipImg,
            shipname: ship.ObjectName,
            shipclass: ship.ObjectGame.model,
            health: ship.ObjectGame.health.amount,
            maxhealth: ship.ObjectGame.health.max,
            crew: crewMembers.length,
            maxcrew: ship.ObjectGame.maxCrew,
            cargo: ship.ObjectGame.cargo,
            maxcargo: ship.ObjectGame.maxCargo
        };

        io.to(PlayerID).emit('ShipPackageStatus', payload);
    }
}

module.exports = { EmulatorAddPlayerToShip };
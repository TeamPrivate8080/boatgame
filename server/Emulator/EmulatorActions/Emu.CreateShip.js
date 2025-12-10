const { Players, Fleets, ShopVehicles, Islands } = require("../../ServerStoring.js");
const { ConfigCache } = require('../../ConfigLoader.js');

function EmulatorCreateShip(io, peer, ClientPayload) {
    const Peer = peer;
    const FleetId = Peer.id;
    const PlayerID = Peer.id;

    const WORLD_RADIUS = 1000;       // total spawn area

    let x, z;
    let safe = false;
    while (!safe) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * WORLD_RADIUS;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;

        safe = true;
        for (const island of Islands) {
            const dx = x - island.pos.x;
            const dz = z - island.pos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 70) {
                safe = false;
                break;
            }
        }
    }

    const startShipName = ConfigCache?.Players?.StartShip || "StarterRaft";
    const modelEntry = Object.entries(ShopVehicles).find(([_, data]) => data.name === startShipName);
    const [modelKey, modelData] = modelEntry || ["s1", ShopVehicles["s1"]];

    Fleets[FleetId] = {
        ObjectID: FleetId,
        ObjectName: `${Players[PlayerID].ObjectName}'s Fleet`,
        ObjectData: {
            position: { x, y: -1, z },
            rotation: { x: 0, y: Math.random() * 2 * Math.PI, z: 0 },
            sailing: true,
            steer: null,
            sinking: false
        },
        ObjectGame: {
            health: {
                amount: modelData.health,
                max: modelData.health
            },
            model: startShipName,
            LastSharkDamage: 0,
            crew: modelData.crew,
            maxCrew: modelData.maxCrew,
            cargo: 0,
            maxCargo: modelData.maxCargo
        },
        Owner: PlayerID,
        Invite: Array.from({ length: 8 }, () =>
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
            Math.floor(Math.random() * 62)
            ]
        ).join('')
    };


    if (Fleets[FleetId]) {
        io.to(Peer.OpenRoomKey).emit('CreateFleet', { FleetPayload: Fleets[FleetId] });
        Peer.emit('ExistingFleets', { Fleets: Object.values(Fleets) });
        Peer.emit('GenerateInviteURL', Fleets[FleetId].Invite);

        io.emit('update_ship_health', {
            fleetid: Fleets[FleetId].ObjectID,
            health: modelData.health,
            maxhealth: modelData.health
        });

        if (ConfigCache.Server.Debug)
            console.log('[Fleet]', 'Fleet created with model:', modelKey, 'Health:', modelData.health);
    }

    setTimeout(() => {
        Peer.emit('temp_cache', {
            item: 'Ships',
            payload: ShopVehicles
        });
    }, 1000);
}

module.exports = {
    EmulatorCreateShip
};

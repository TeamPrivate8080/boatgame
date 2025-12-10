const { Players, Pumps } = require('../../ServerStoring');

function EmulatorPlaceSaltPump(Engine, Peer, player, Payload) {
    let pumpSlot = null;
    let pumpSlotIndex = null;

    if (Pumps.filter(p => p.ownerId === Peer.id).length >= 3) {
        Engine.to(Peer.id).emit('rt_alert', 'You can only have three salt pumps.')
        return;
    }

    for (let i = 1; i <= 5; i++) {
        const slot = player.ObjectGame[`s${i}`];
        if (slot && slot.item === 'pump' && slot.wearing) {
            pumpSlot = slot;
            pumpSlotIndex = i;
            break;
        }
    }

    if (!pumpSlot) {
        return;
    }

    if (pumpSlot.item !== 'pump') {
        io.to(Peer.id).emit('rt_alert', 'Pump item not found.')
        return;
    }

    const p = Payload;

    const valid =
        p &&
        typeof p === "object" &&
        p.position &&
        typeof p.position.x === "number" &&
        typeof p.position.y === "number" &&
        typeof p.position.z === "number" &&
        p.rotation &&
        typeof p.rotation.isEuler === "boolean" &&
        typeof p.rotation._x === "number" &&
        typeof p.rotation._y === "number" &&
        typeof p.rotation._z === "number" &&
        typeof p.rotation._order === "string";

    if (!valid) {
        console.log("Pump use blocked: INVALID PAYLOAD STRUCTURE", Payload);
        return;
    }

    Peer.emit('DeletePump');
    pumpSlot.item = null;
    pumpSlot.wearing = false;
    Peer.emit('RemoveSlot', pumpSlotIndex);

    const PumpHealth = 800;

    const pumpId = Pumps.length > 0 ? Pumps[Pumps.length - 1].id + 1 : 1;

    const pumpData = {
        id: pumpId,
        ownerId: Peer.id,
        position: { ...p.position },
        rotation: { ...p.rotation },
        health: PumpHealth
    };

    Pumps.push(pumpData);

    Engine.emit('PlacePump', {
        id: pumpId,
        position: p.position,
        rotation: p.rotation,
        health: PumpHealth
    });

    Engine.to(Peer.id).emit('rt_alert', 'Your new salt pump is ready and now generating gold.')
}

module.exports = {
    EmulatorPlaceSaltPump
}
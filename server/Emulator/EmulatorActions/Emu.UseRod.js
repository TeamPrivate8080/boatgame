const { Fleets } = require("../../ServerStoring.js");
const { EmulatorPackets } = require('../NetCode/Emu.Packets.js');
const { ConfigCache } = require('../../ConfigLoader.js');
const THREE = require('three');

// sock, client sock, call payload
function EmulatorUseRod(io, peer, ClientPayload) {

    const player = ClientPayload;
    const Peer = peer;
    const ThisPacket = EmulatorPackets[1];

    let wearingRod = false;
    for (let i = 1; i <= 5; i++) {
        const slot = player.ObjectGame[`s${i}`];
        if (slot?.item === 'fishingrod' && slot.wearing) {
            wearingRod = true;
            break;
        }
    }

    if (!wearingRod) return;
    if (player.ObjectGame.fishing === true) return;

    const fleet = Fleets[player.ObjectGame.inship];

    let worldPlayerPos = new THREE.Vector3(player.ObjectData.position.x, player.ObjectData.position.y, player.ObjectData.position.z);
    let worldPlayerRotY = player.ObjectData.rotation.y || 0;

    if (fleet && !player.ObjectGame.docked) {
        const fleetPos = new THREE.Vector3(fleet.ObjectData.position.x, fleet.ObjectData.position.y, fleet.ObjectData.position.z);
        const fleetRotY = fleet.ObjectData.rotation.y || 0;
        const fleetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, fleetRotY, 0, 'YXZ'));

        worldPlayerPos.applyQuaternion(fleetQuat).add(fleetPos);
        worldPlayerRotY += fleetRotY;
    }

    const playerRot = new THREE.Euler(0, worldPlayerRotY, 0, 'YXZ');
    const rodPitch = player.ItemStates?.rod?.rotation || 0;
    const rodRot = new THREE.Euler(rodPitch, 0, 0, 'YXZ');

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyEuler(rodRot).applyEuler(playerRot);

    const right = new THREE.Vector3(1, 0, 0).applyEuler(playerRot);
    const rightOffset = right.multiplyScalar(0.7);
    const backOffset = forward.clone().multiplyScalar(-0.5);
    const heightOffset = new THREE.Vector3(0, 0.25, 0);

    const rodStartPos = worldPlayerPos.clone().add(rightOffset).add(backOffset).add(heightOffset);

    io.emit(ThisPacket, {
        PlayerID: Peer,
        StartPos: { x: rodStartPos.x, y: rodStartPos.y, z: rodStartPos.z },
        direction: { x: forward.x, y: forward.y, z: forward.z }
    });

    player.ObjectGame.fishing = true;


const randomDelay = Math.floor(Math.random() * 6000) + 1000;
    player.ObjectGame.FishCatchTime = Date.now() + randomDelay;

    player.ItemStates.rod.LastPosition = { x: rodStartPos.x, y: rodStartPos.y, z: rodStartPos.z };
    player.ItemStates.rod.LastDirection = { x: forward.x, y: forward.y, z: forward.z };

    if (ConfigCache.Server.Debug)
        console.log(`(SERVER) rod thrown by ${Peer}, fish in ${randomDelay}ms`);

}

module.exports = {
    EmulatorUseRod
}
const { Fleets, Bullets } = require("../../ServerStoring.js");
const THREE = require("three");

// sock, client sock, player
function EmulatorUseCannon(io, peer, player) {
    const Peer = peer;
    const now = Date.now();

    const hasCannonEquipped = Object.values(player.ObjectGame).some(slot =>
        slot?.wearing && slot.item === 'cannon'
    );
    if (!hasCannonEquipped) return;

    if (!player.ObjectGame.LastShootCannon) player.ObjectGame.LastShootCannon = 0;
    if (now - player.ObjectGame.LastShootCannon < 1000) return;
    player.ObjectGame.LastShootCannon = now;

    const fleet = Fleets[player.ObjectGame.inship];
    if (!fleet || !fleet.ObjectData) return;

    let worldPlayerPos = new THREE.Vector3(
        player.ObjectData.position.x,
        player.ObjectData.position.y,
        player.ObjectData.position.z
    );
    let worldPlayerRotY = player.ObjectData.rotation.y || 0;

    if (!player.ObjectGame.docked) {
        const fleetPos = new THREE.Vector3(
            fleet.ObjectData.position.x,
            fleet.ObjectData.position.y,
            fleet.ObjectData.position.z
        );
        const fleetRotY = fleet.ObjectData.rotation.y || 0;
        const fleetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, fleetRotY, 0, "YXZ"));
        worldPlayerPos.applyQuaternion(fleetQuat).add(fleetPos);
        worldPlayerRotY += fleetRotY;
    }


    let cannonPitch = player.ItemStates?.cannon?.rotation || 0;

    const maxPitch = 0.8;
    const minPitch = -0.8;

    cannonPitch = Math.max(minPitch, Math.min(maxPitch, cannonPitch));

    const fullRot = new THREE.Euler(cannonPitch, worldPlayerRotY, 0, "YXZ");
    const forward = new THREE.Vector3(0, 0, -5).applyEuler(fullRot).normalize();

    const spawnPos = worldPlayerPos.clone();

    const cannonBall = {
        id: Date.now() + Math.random(),
        position: { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
        direction: { x: forward.x, y: forward.y, z: forward.z },
        speed: 3,
        owner: Peer,
        CA: now,
        damage: 50,
        type: "cannonball",
        s: Date.now()
    };

    Bullets.push(cannonBall);
}

module.exports = { EmulatorUseCannon };
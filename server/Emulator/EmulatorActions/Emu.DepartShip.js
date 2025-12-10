const { Players, Fleets, Islands } = require("../../ServerStoring.js");
const THREE = require("three");

function EmulatorRequestDepartShip(Engine, Peer, pay) {
    const player = Players[Peer.id];
        if (!player) return;
    
        const fleetID = player.ObjectGame?.groupid;
        if (!fleetID) return;
    
        const fleet = Fleets[fleetID];
        if (!fleet) return;
    
        if (!player.ObjectGame.docked) return; // must be docked
        if (player.ObjectID !== fleet.Owner) return; // must be fleet owner
    
        const PlrVec3 = new THREE.Vector3(
            player.ObjectData.position.x,
            0,
            player.ObjectData.position.z
        );
    
        const FleetVec3 = new THREE.Vector3(
            fleet.ObjectData.position.x,
            0,
            fleet.ObjectData.position.z
        );
    
        const distanceToFleet = PlrVec3.distanceTo(FleetVec3);
        if (distanceToFleet > 20) {
            Engine.to(Peer.id).emit('rt_alert', 'Not close enough to your fleet.')
            return;
        }
    
        const islandName = player.ObjectGame?.island;
        if (!islandName) return;
    
        const island = Islands.find(i => i.name === islandName);
        if (!island) return;
    
        const IslandPosVec3 = new THREE.Vector3(island.pos.x, 0, island.pos.z);
    
        const outward = new THREE.Vector3().subVectors(FleetVec3, IslandPosVec3);
        outward.y = 0;
    
        if (outward.lengthSq() < 0.0001) {
            return;
        }
    
        outward.normalize();
    
        const dist = 75;
        const newFleetPos = new THREE.Vector3().addVectors(
            IslandPosVec3,
            outward.clone().multiplyScalar(dist)
        );
    
        fleet.ObjectData.position.x = newFleetPos.x;
        fleet.ObjectData.position.z = newFleetPos.z;
    
        const forward_vector = new THREE.Vector3(-1, 0, 0);
        const q = new THREE.Quaternion().setFromUnitVectors(forward_vector, outward);
        const euler = new THREE.Euler().setFromQuaternion(q, 'YXZ');
        let yaw = euler.y;
        yaw = ((yaw % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
        fleet.ObjectData.rotation.y = yaw;
    
        fleet.ObjectData.sailing = true;
        fleet.ObjectGame.docked = false;
    
        for (const pID in Players) {
            const p = Players[pID];
            if (p.ObjectGame?.groupid === fleetID) {
                p.ObjectGame.docked = false;
                p.ObjectGame.island = null;
                p.ObjectGame.inship = fleet.ObjectID;
                p.ObjectGame.groupid = fleet.ObjectID;
                p.ObjectData.last_action = new Date();
    
                Engine.emit("AddPlayerToFleet", pID, fleet.ObjectID);
    
                p.ObjectData.position.x = 0;
                p.ObjectData.position.z = 0;
            }
        }
    
        Engine.emit('FleetDockDepart', {
            fleetid: fleet.ObjectID,
            actiondock: false
        });
}

module.exports = {
    EmulatorRequestDepartShip
}
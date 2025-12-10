const THREE = require('three');
const { Bullets, Fleets, Sharks, Players, Pumps } = require("./ServerStoring");
const {
    EmulatorHandleMessageChatComposer,
    EmulatorSpawnShark,
    EmulatorRemovePlayersFromFleet
} = require("./Emulator/EmulatorExporter");

const FleetVertices = require('./vectors/LargeRaft.json');
const StarterRaftVertices = require('./vectors/StarterRaft.json');
const ExplorerRaftVertices = require('./vectors/ExplorerRaft.json');
const Boat1Vertices = require('./vectors/Boat1.json');

const FleetVerticesMap = {
    'StarterRaft': StarterRaftVertices,
    'ExplorerRaft': ExplorerRaftVertices,
    'LargeRaft': FleetVertices,
    'Boat1': Boat1Vertices
};

// --- Precompute bounds test ---
const FleetBoundingMap = {};
for (const modelName in FleetVerticesMap) {
    const verts = FleetVerticesMap[modelName];
    if (!verts || verts.length === 0) continue;

    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    const projectedVerts = [];

    for (let i = 0; i < verts.length; i++) {
        const v = verts[i];
        minX = Math.min(minX, v[0]);
        maxX = Math.max(maxX, v[0]);
        minZ = Math.min(minZ, v[2]);
        maxZ = Math.max(maxZ, v[2]);
        projectedVerts.push([v[0], v[2]]);
    }

    FleetBoundingMap[modelName] = { minX, maxX, minZ, maxZ, projectedVerts };
}

function UpdateBullets(io) {
    const now = Date.now();
    const gravity = -0.05;
    const lifetime = 6000;
    const waterLevel = -10;

    for (let i = Bullets.length - 1; i >= 0; i--) {
        const b = Bullets[i];
        if (b.vy === undefined) b.vy = b.direction.y * b.speed;

        b.position.x += b.direction.x * b.speed;
        b.position.z += b.direction.z * b.speed;
        b.vy += gravity;
        b.position.y += b.vy;
        b.speed *= 0.999;

        let hitObject = null;

        // --- FLEET COLLISION ---
        for (const fid in Fleets) {
            const f = Fleets[fid];
            if (!f?.ObjectData?.position) continue;

            const shooterFleet = Fleets[b.owner];
            if (shooterFleet) {
                if (f.Owner === shooterFleet.Owner) continue;
                if (f.ObjectID === shooterFleet.ObjectID) continue;
            }

            const modelName = f.ObjectGame?.model;
            const bounding = FleetBoundingMap[modelName];
            if (!bounding) continue;

            const fleetPos = f.ObjectData.position;
            const fleetRot = f.ObjectData.rotation.y || 0;
            const fleetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, fleetRot, 0, 'YXZ'));
            const invQuat = fleetQuat.clone().invert();
            const localPos = new THREE.Vector3(b.position.x - fleetPos.x, b.position.y - fleetPos.y, b.position.z - fleetPos.z)
                .applyQuaternion(invQuat);

            if (
                localPos.x < bounding.minX || localPos.x > bounding.maxX ||
                localPos.z < bounding.minZ || localPos.z > bounding.maxZ
            ) continue;

            let closeEnough = false;
            for (let vi = 0; vi < bounding.projectedVerts.length; vi++) {
                const [vx, vz] = bounding.projectedVerts[vi];
                const dx = localPos.x - vx;
                const dz = localPos.z - vz;
                if ((dx*dx + dz*dz) <= 1.0) {
                    closeEnough = true;
                    break;
                }
            }
            if (!closeEnough) continue;

            hitObject = { type: "fleet", object: f };
            break;
        }

        // --- SHARK COLLISION ---
        if (!hitObject) {
            for (const sid in Sharks) {
                const s = Sharks[sid];
                if (!s?.ObjectData?.position) continue;

                const dx = b.position.x - s.ObjectData.position.x;
                const dz = b.position.z - s.ObjectData.position.z;
                const dy = b.position.y - s.ObjectData.position.y;
                if (dx*dx + dy*dy + dz*dz < 16) {
                    hitObject = { type: "shark", object: s };

                    const player = Players[b.owner];
                    io.to(b.owner).emit("net.marker.dmg", {
                        sharkid: s.ObjectID,
                        damage: Math.round(Math.min(120, 20 + (now - b.s) * 0.02)),
                        neg: true,
                    });

                    break;
                }
            }
        }

        // --- PUMP COLLISION ---
        if (!hitObject) {
            for (let j = 0; j < Pumps.length; j++) {
                const pump = Pumps[j];
                if (!pump) continue;

                const halfX = 2.4, halfZ = 1.3, halfY = 4.4;
                const dx = Math.abs(b.position.x - pump.position.x);
                const dz = Math.abs(b.position.z - pump.position.z);
                const dy = Math.abs(b.position.y - (pump.position.y || 0));
                if (dx <= halfX && dz <= halfZ && dy <= halfY) {
                    hitObject = { type: "pump", object: pump };
                    break;
                }
            }
        }

        // --- APPLY HIT DAMAGE ---
        const distance = now - b.s * 0.02;
        const TargetDamage = Math.min(120, 20 + distance * 0.6);

        if (hitObject) {
            const player = Players[b.owner];

            if (hitObject.type === "fleet" && hitObject.object.ObjectData.sailing === true) {
                const f = hitObject.object;
                f.ObjectGame.health.amount -= TargetDamage;

                if (player) player.GainedValues.xp += Math.floor(Math.random() * 11) + 10;

                if (f.ObjectGame.health.amount <= 0 && f.ObjectData.sailing === true) {
                    EmulatorRemovePlayersFromFleet(io, f, 'sea', true);
                    Fleets[f.ObjectID].ObjectData.sinking = true;
                    Fleets[f.ObjectID].ObjectData.sailing = false;

                    setTimeout(() => {
                        if (Fleets[f.ObjectID]) delete Fleets[f.ObjectID];
                        io.emit('DeleteFleet', f.ObjectID);
                    }, 5000);

                    if (player) {
                        player.GainedValues.kills = (player.GainedValues.kills || 0) + 1;
                        player.GainedValues.xp += 400;
                        player.ObjectGame.kills++;
                    }

                    EmulatorHandleMessageChatComposer(io, "str.null", {
                        Message: `${f.ObjectName} was sunk by ${player?.ObjectName || "unknown"}!`,
                        SenderName: "Server",
                    });

                    io.emit('rt_alert', `${f.ObjectName} was sunk by ${player?.ObjectName || "unknown"}!`);
                }

                io.emit("update_ship_health", {
                    fleetid: f.ObjectID,
                    health: f.ObjectGame.health.amount,
                    maxhealth: f.ObjectGame.health.max,
                });

                io.to(b.owner).emit("net.marker.dmg", {
                    fleetid: f.ObjectID,
                    damage: Math.round(TargetDamage),
                    neg: true,
                });
            }
            else if (hitObject.type === "pump") {
                const pump = hitObject.object;
                pump.health = Math.max(0, (pump.health || pump.maxHealth) - TargetDamage);
                io.emit("update_pump_health", { id: pump.id, health: pump.health });
                if (pump.health <= 0) {
                    const idx = Pumps.findIndex(p => p.id === pump.id);
                    if (idx !== -1) Pumps.splice(idx, 1);
                    io.emit("DeletePumps", [pump.id]);
                    io.to(pump.ownerId).emit('rt_alert', Players[b.owner].ObjectName + ' destroyed one of your salt pumps.');
                }
                if (player) player.GainedValues.xp += 1;

                io.to(b.owner).emit("net.marker.dmg", {
                    pumpid: pump.id,
                    damage: Math.round(TargetDamage),
                    neg: true,
                });
            }

            Bullets.splice(i, 1);
            continue;
        }

        if (b.position.y <= waterLevel || now - b.CA > lifetime) Bullets.splice(i, 1);
    }
}

module.exports = { UpdateBullets };
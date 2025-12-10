const THREE = require('three');
const { Players, Fleets, Sharks, Bullets, Islands, ShopVehicles, Crates, Pumps } = require('./ServerStoring.js');
const IslandVertices = require('./vectors/jamaica.json');
const { UpdateBullets } = require('./MoveProjectiles.js');
const { HandleSteering } = require('./HandleFleetSteering.js');
const FleetVertices = require('./vectors/LargeRaft.json');
const StarterRaftVertices = require('./vectors/StarterRaft.json');
const ExplorerRaftVertices = require('./vectors/ExplorerRaft.json');
const Boat1Vertices = require('./vectors/Boat1.json');
const {
    EmulatorThrowFishReward,
} = require('./Emulator/EmulatorActions/Emu.FishReward.js');
const { 
    EmulatorSpawnNewCrate,
    EmulatorUseCannon,
    EmulatorUseRod,
    EmulatorRemovePlayersFromFleet
} = require('./Emulator/EmulatorExporter.js')
const { MoveSharks } = require('./SharkMovement.js')

const FleetVerticesMap = {
    'raft1': StarterRaftVertices,
    'raft2': StarterRaftVertices,
    'raft3': StarterRaftVertices,
    'Boat1': Boat1Vertices,
    'Boat2': Boat1Vertices,
    'Boat3': Boat1Vertices
};

function EngineTicker(io) {
    const tickRate = 30;
    const delta = 1 / tickRate;
    const DefaultPlrSpeed = 8;
    const gravity = -135;
    const jumpStrength = 26;
    const WORLD_RADIUS = 1000;
    const EPS = 0.001;

    setInterval(() => {
        const now = Date.now();
        MoveSharks(io);

        for (const PlayerID in Players) {
            const player = Players[PlayerID];
            if (!player) continue;

            if (player.ObjectGame.holdmouse) {
                // Cannon
                if (!player.ObjectGame.LastShootCannon) player.ObjectGame.LastShootCannon = 0;
                if (now - player.ObjectGame.LastShootCannon >= 1000) {
                    EmulatorUseCannon(io, PlayerID, player); // pass minimal peer
                }

                // Fishing rod
                const rodEquipped = Object.values(player.ObjectGame).some(slot =>
                    slot?.wearing && slot.item === 'fishingrod'
                );

                if (rodEquipped && player.ObjectGame.FishCatchTime && now >= player.ObjectGame.FishCatchTime) {
                    EmulatorUseRod(io, PlayerID, player);
                }
            }

            if (player.ObjectGame.fishing && player.ObjectGame.FishCatchTime && Date.now() >= player.ObjectGame.FishCatchTime) {
                const id = player.ObjectID
                EmulatorThrowFishReward(io, null, { player, id });
            }

            const keys = player.ObjectData.keys || {};
            const vel = player.ObjectData.velocity || { x: 0, y: 0, z: 0 };
            const pos = player.ObjectData.position || { x: 0, y: 0, z: 0 };
            const rotY = (player.ObjectData.rotation && player.ObjectData.rotation.y) || 0;

            if (player.ObjectGame && player.ObjectGame.inship && Fleets[player.ObjectGame.inship] && !player.ObjectGame.docked) {
                const fleet = Fleets[player.ObjectGame.inship];

                // Check if player has been idle for more than 2 seconds
                const IsIdleCheck = player.ObjectData.last_action && (now - player.ObjectData.last_action.getTime()) > 5000;

                // Fleet position & rotation (always updated)
                const fleetPos = {
                    x: fleet.ObjectData.position.x,
                    y: fleet.ObjectData.position.y,
                    z: fleet.ObjectData.position.z
                };
                const RawFleetRot = fleet.ObjectData.rotation.y || 0;
                const FleetVecRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, RawFleetRot, 0, 'YXZ'));

                // Equipped raft model
                const modelName = fleet.ObjectGame?.model;

                // ship flat bounding
                let shipWidth = 0, shipLength = 0;
                for (const key in ShopVehicles) {
                    if (ShopVehicles[key].name === modelName) {
                        shipWidth = ShopVehicles[key].ModelLength;
                        shipLength = ShopVehicles[key].ModelWidth;
                        break;
                    }
                }
                const halfWidth = shipWidth / 2;
                const halfLength = shipLength / 2;

                // Get correct vertices for collision
                const CurrentFleetVertices = FleetVerticesMap[modelName] || FleetVertices;

                // Player movement non idle
                if (!IsIdleCheck) {
                    // Calculate move vector
                    const MoveVector = { x: 0, y: 0, z: 0 };
                    if (keys.forward) MoveVector.z -= 1;
                    if (keys.backward) MoveVector.z += 1;
                    if (keys.left) MoveVector.x -= 1;
                    if (keys.right) MoveVector.x += 1;

                    // Normalize move vector
                    const lenSq = MoveVector.x ** 2 + MoveVector.z ** 2;
                    if (lenSq > 0) {
                        const len = Math.sqrt(lenSq);
                        MoveVector.x /= len;
                        MoveVector.z /= len;
                    }

                    // Apply speed
                    MoveVector.x *= DefaultPlrSpeed * delta;
                    MoveVector.z *= DefaultPlrSpeed * delta;

                    // Rotate movement by player rotation
                    const PlayerRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, 0, 'YXZ'));
                    const MoveVec3 = new THREE.Vector3(MoveVector.x, 0, MoveVector.z).applyQuaternion(PlayerRotation);

                    // Apply movement to pos (local fleet space)
                    pos.x += MoveVec3.x;
                    pos.z += MoveVec3.z;

                    // Clamp inside bounding rectangle of the raft
                    pos.x = Math.max(-halfWidth, Math.min(halfWidth, pos.x));
                    pos.z = Math.max(-halfLength, Math.min(halfLength, pos.z));

                    // Convert local pos to world for height/collision
                    const WorldPosition = new THREE.Vector3(pos.x, pos.y, pos.z)
                        .applyQuaternion(FleetVecRot)
                        .add(new THREE.Vector3(fleetPos.x, fleetPos.y, fleetPos.z));

                    // Compute floor height by connecting all vertices as triangles
                    let PatchmaxY = fleetPos.y; // default/fallback
                    const tmpA = new THREE.Vector3();
                    const tmpB = new THREE.Vector3();
                    const tmpC = new THREE.Vector3();
                    const playerXZ = new THREE.Vector2(WorldPosition.x, WorldPosition.z);

                    for (let i = 0; i < CurrentFleetVertices.length; i += 3) {
                        if (i + 2 >= CurrentFleetVertices.length) break;

                        tmpA.set(...CurrentFleetVertices[i]).applyQuaternion(FleetVecRot).add(new THREE.Vector3(fleetPos.x, fleetPos.y, fleetPos.z));
                        tmpB.set(...CurrentFleetVertices[i + 1]).applyQuaternion(FleetVecRot).add(new THREE.Vector3(fleetPos.x, fleetPos.y, fleetPos.z));
                        tmpC.set(...CurrentFleetVertices[i + 2]).applyQuaternion(FleetVecRot).add(new THREE.Vector3(fleetPos.x, fleetPos.y, fleetPos.z));

                        const a2 = new THREE.Vector2(tmpA.x, tmpA.z);
                        const b2 = new THREE.Vector2(tmpB.x, tmpB.z);
                        const c2 = new THREE.Vector2(tmpC.x, tmpC.z);

                        const v0 = c2.clone().sub(a2);
                        const v1 = b2.clone().sub(a2);
                        const v2 = playerXZ.clone().sub(a2);

                        const dot00 = v0.dot(v0);
                        const dot01 = v0.dot(v1);
                        const dot02 = v0.dot(v2);
                        const dot11 = v1.dot(v1);
                        const dot12 = v1.dot(v2);

                        const InvDen = 1 / (dot00 * dot11 - dot01 * dot01);
                        const u = (dot11 * dot02 - dot01 * dot12) * InvDen;
                        const v = (dot00 * dot12 - dot01 * dot02) * InvDen;

                        if (u >= 0 && v >= 0 && (u + v <= 1)) {
                            const bv0 = b2.clone().sub(a2);
                            const bv1 = c2.clone().sub(a2);
                            const bv2 = playerXZ.clone().sub(a2);

                            const d00 = bv0.dot(bv0);
                            const d01 = bv0.dot(bv1);
                            const d11 = bv1.dot(bv1);
                            const d20 = bv2.dot(bv0);
                            const d21 = bv2.dot(bv1);

                            const denom = d00 * d11 - d01 * d01;
                            const bv = (d11 * d20 - d01 * d21) / denom;
                            const bw = (d00 * d21 - d01 * d20) / denom;
                            const bu = 1 - bv - bw;

                            const y = bu * tmpA.y + bv * tmpB.y + bw * tmpC.y + 0.5;
                            if (y > PatchmaxY) PatchmaxY = y;
                        }
                    }


                    // Jump
                    if (keys.jump && WorldPosition.y <= PatchmaxY + EPS) vel.y = jumpStrength;
                    vel.y += gravity * delta;
                    WorldPosition.y += vel.y * delta;

                    if (WorldPosition.y < PatchmaxY) {
                        WorldPosition.y = PatchmaxY;
                        vel.y = 0;
                    }

                    // Convert world Y back to local fleet space
                    const LocFixedY = WorldPosition.clone()
                        .sub(new THREE.Vector3(fleetPos.x, fleetPos.y, fleetPos.z))
                        .applyQuaternion(FleetVecRot.clone().invert());
                    pos.y = LocFixedY.y;

                    player.ObjectData.position = pos;
                    player.ObjectData.velocity = vel;
                    player.ObjectData.rotation.y = rotY;

                }

            } else {
                // input vec
                const MoveVector = new THREE.Vector3(
                    (keys.right ? 1 : 0) - (keys.left ? 1 : 0),
                    0,
                    (keys.backward ? 1 : 0) - (keys.forward ? 1 : 0)
                );

                // prevent diagonal multi speed
                const MoveLength = MoveVector.lengthSq();
                if (MoveLength > 0) {
                    MoveVector.multiplyScalar((DefaultPlrSpeed * delta) / Math.sqrt(MoveLength));
                } else {
                    MoveVector.set(0, 0, 0);
                }

                // dir by player rotation
                const PlayerRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
                MoveVector.applyQuaternion(PlayerRotation);

                // Apply move to world pos
                let WorldPos = new THREE.Vector3(pos.x + MoveVector.x, pos.y + MoveVector.y, pos.z + MoveVector.z);

                // Limit movement if docked
                let islandOffset = new THREE.Vector3(0, 0, 0);
                if (player.ObjectGame.island) {
                    const island = Islands.find(i => i.name === player.ObjectGame.island);
                    if (island) {
                        islandOffset.set(island.pos.x, 0, island.pos.z);

                        const dx = WorldPos.x - island.pos.x;
                        const dz = WorldPos.z - island.pos.z;
                        const distSq = dx * dx + dz * dz;
                        const maxRadius = 69;
                        if (distSq > maxRadius * maxRadius) {
                            const dist = Math.sqrt(distSq);
                            const scale = maxRadius / dist;
                            WorldPos.x = island.pos.x + dx * scale;
                            WorldPos.z = island.pos.z + dz * scale;
                        }
                    }
                }

                // island height calculation
                let PatchmaxY = -Infinity;
                const px = WorldPos.x, pz = WorldPos.z;

                for (let i = 0; i < IslandVertices.length; i += 3) {
                    const v0 = IslandVertices[i], v1 = IslandVertices[i + 1], v2 = IslandVertices[i + 2];

                    // offset with island position
                    const v0x = v0[0] + islandOffset.x, v0y = v0[1], v0z = v0[2] + islandOffset.z;
                    const v1x = v1[0] + islandOffset.x, v1y = v1[1], v1z = v1[2] + islandOffset.z;
                    const v2x = v2[0] + islandOffset.x, v2y = v2[1], v2z = v2[2] + islandOffset.z;

                    // 2d barycentric fast inline math
                    const v0v2x = v2x - v0x, v0v2z = v2z - v0z;
                    const v0v1x = v1x - v0x, v0v1z = v1z - v0z;
                    const v0px = px - v0x, v0pz = pz - v0z;

                    const dot00 = v0v2x * v0v2x + v0v2z * v0v2z;
                    const dot01 = v0v2x * v0v1x + v0v2z * v0v1z;
                    const dot02 = v0v2x * v0px + v0v2z * v0pz;
                    const dot11 = v0v1x * v0v1x + v0v1z * v0v1z;
                    const dot12 = v0v1x * v0px + v0v1z * v0pz;

                    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
                    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
                    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

                    if (u >= 0 && v >= 0 && u + v <= 1) {
                        const y = v0y + u * (v2y - v0y) + v * (v1y - v0y);
                        if (y > PatchmaxY) PatchmaxY = y + 0.6;
                    }
                }

                if (PatchmaxY === -Infinity) PatchmaxY = -1.6;
                if (PatchmaxY < -1.6) PatchmaxY = -1.6;

                // --- Jump ---
                const EPS = 0.15;
                const isGrounded = WorldPos.y <= PatchmaxY + EPS;

                if (isGrounded) {
                    if (WorldPos.y < PatchmaxY) WorldPos.y = PatchmaxY;
                    vel.y = keys.jump ? jumpStrength : Math.max(vel.y, -2);
                } else {
                    vel.y += gravity * delta;
                }

                WorldPos.y += vel.y * delta;
                if (WorldPos.y < PatchmaxY) {
                    WorldPos.y = PatchmaxY;
                    vel.y = 0;
                }
                if (!keys.jump && vel.y <= 0 && WorldPos.y - PatchmaxY < 0.2) {
                    WorldPos.y = THREE.MathUtils.lerp(WorldPos.y, PatchmaxY, 0.3);
                }

                pos.x = WorldPos.x;
                pos.y = WorldPos.y;
                pos.z = WorldPos.z;
                player.ObjectData.position = pos;
                player.ObjectData.velocity = vel;

            }

            HandleSteering(player);
        }


        const filteredFleets = {};

        for (const FleetID in Fleets) {
            const fleet = Fleets[FleetID];
            if (!fleet || !fleet.ObjectData.sailing) continue;

            const pos = fleet.ObjectData.position;
            let rotY = fleet.ObjectData.rotation.y || 0;

            if (fleet.ObjectData.sinking === true) {
                Fleets[FleetID].ObjectData.position.y -= 0.2
            }

            let SailSpeed = 10;
            const modelName = fleet.ObjectGame?.model;

            let shipWidth = 0, shipLength = 0, RotationSpeed = 0;
            for (const key in ShopVehicles) {
                const ship = ShopVehicles[key];
                if (ship.name === modelName) {
                    shipWidth = ship.ModelWidth;
                    shipLength = ship.ModelLength;
                    RotationSpeed = ship.RotationSpeed;
                    SailSpeed = ship.speed * 1.2
                    break;
                }
            }

            const halfWidth = shipWidth / 2;
            const halfLength = shipLength / 2;

            for (let i = 0; i < Pumps.length; i++) {
                const pump = Pumps[i];
                if (!pump) continue;

                // Pump sizes
                const halfX = 2.4; // width / 2
                const halfZ = 1.3; // depth / 2
                const halfY = 4.4; // height / 2 pump height

                //  Fleet sizes
                const fleetHalfX = halfLength;
                const fleetHalfZ = halfWidth;
                const fleetHalfY = 3; // based fleet height

                // Compute distances
                const dx = pos.x - pump.position.x;
                const dz = pos.z - pump.position.z;
                const dy = pos.y - (pump.position.y || 0);

                // AABB overlap
                if (Math.abs(dx) <= fleetHalfX + halfX &&
                    Math.abs(dz) <= fleetHalfZ + halfZ &&
                    Math.abs(dy) <= fleetHalfY + halfY) {

                    // smallest overlap axis for minimal push
                    const overlapX = fleetHalfX + halfX - Math.abs(dx);
                    const overlapZ = fleetHalfZ + halfZ - Math.abs(dz);
                    const overlapY = fleetHalfY + halfY - Math.abs(dy);

                    // Push along the axis
                    if (overlapX <= overlapZ && overlapX <= overlapY) {
                        pos.x += dx > 0 ? overlapX : -overlapX;
                    } else if (overlapZ <= overlapX && overlapZ <= overlapY) {
                        pos.z += dz > 0 ? overlapZ : -overlapZ;
                    } else {
                        pos.y += dy > 0 ? overlapY : -overlapY;
                    }

                }
            }

            for (let i = 0; i < Crates.length; i++) {
                const crate = Crates[i];
                if (!crate) continue;

                const dx = Math.abs(pos.x - crate.x);
                const dz = Math.abs(pos.z - crate.z);
                const crateSize = 1;

                if (dx <= halfWidth + crateSize && dz <= halfLength + crateSize) {
                    Crates.splice(i, 1);
                    io.emit('collect_crate', { CrateID: crate.id, FleetID });
                    EmulatorSpawnNewCrate(io);

                    const RewardXP = 200;
                    const RewardWood = 10;

                    const members = Object.values(Players).filter(
                        p => p?.ObjectGame?.inship === FleetID
                    );

                    if (members.length > 0) {
                        const xpEach = RewardXP / members.length;
                        const woodEach = RewardWood / members.length;

                        for (const member of members) {
                            member.GainedValues.xp += xpEach;

                            member.ValueStates.wood.amount += woodEach;

                            io.to(member.ObjectID).emit('UValues', {
                                gold: Players[member.ObjectID].ValueStates.gold.amount,
                                wood: Players[member.ObjectID].ValueStates.wood.amount
                            });
                        }
                    }

                    break;
                }

            }

            const dx = -Math.cos(rotY) * SailSpeed * delta;
            const dz = Math.sin(rotY) * SailSpeed * delta;
            pos.x += dx;
            pos.z += dz;

            if (fleet.ObjectData.steer === 'left') {
                rotY += RotationSpeed;
            } else if (fleet.ObjectData.steer === 'right') {
                rotY -= RotationSpeed;
            }

            fleet.ObjectData.rotation.y = rotY;

            const WORLD_RADIUS = 1000;

            const x = pos.x;
            const z = pos.z;

            const distSq = x * x + z * z;
            const maxDistSq = WORLD_RADIUS * WORLD_RADIUS;

            if (distSq > maxDistSq) {

                const dist = Math.sqrt(distSq);

                const nx = x / dist;
                const nz = z / dist;

                pos.x = nx * WORLD_RADIUS;
                pos.z = nz * WORLD_RADIUS;

                const moveX = -Math.cos(rotY);
                const moveZ = Math.sin(rotY);

                const dot = moveX * nx + moveZ * nz;

                const slideX = moveX - dot * nx;
                const slideZ = moveZ - dot * nz;

                pos.x += slideX * 0.1;
                pos.z += slideZ * 0.1;
            }

            let hitIsland = null;

            const fleetX = pos.x;
            const fleetZ = pos.z;

            for (let i = 0; i < Islands.length; i++) {
                const island = Islands[i];

                const ix = island.pos.x;
                const iz = island.pos.z;

                const dx = fleetX - ix;
                const dz = fleetZ - iz;

                if (dx * dx + dz * dz > 70 * 70) {
                    continue;
                }

                let collided = false;

                for (let j = 0; j < IslandVertices.length; j++) {
                    const v = IslandVertices[j];

                    const vx = v[0] + ix;
                    const vz = v[2] + iz;

                    const dxv = fleetX - vx;
                    const dzv = fleetZ - vz;

                    if (Math.abs(dxv) < (shipWidth / 2 + 2) &&
                        Math.abs(dzv) < (shipLength / 2 + 2)) {

                        collided = true;
                        break;
                    }
                }

                if (collided) {
                    hitIsland = island.name;
                    break;
                }
            }

            if (hitIsland) {
                fleet.ObjectData.sailing = false;

                io.emit('FleetDockDepart', {
                    fleetid: fleet.ObjectID,
                    actiondock: true,
                });

                EmulatorRemovePlayersFromFleet(io, fleet, hitIsland, false)

            }

            filteredFleets[FleetID] = {
                ObjectID: fleet.ObjectID,
                ObjectData: {
                    position: pos,
                    rotation: fleet.ObjectData.rotation,
                    lean: fleet.ObjectData.lean,
                    width: shipWidth,
                    length: shipLength
                }
            };
        }

        // --- Players ---
        const filteredPlayers = {};

        for (const PlayerID in Players) {
            const player = Players[PlayerID];
            if (!player) continue;

            const lastAction = player.ObjectData.last_action;
            const isIdle = lastAction && (now - new Date(lastAction).getTime()) > 10000;

            filteredPlayers[PlayerID] = {
                ObjectID: player.ObjectID,
                ObjectData: {
                    position: player.ObjectData.position,
                    rotation: player.ObjectData.rotation
                },
                ItemStates: {
                    gun: { rotation: player.ItemStates?.gun?.rotation || 0 }
                },
                idle: isIdle
            };
        }

        UpdateBullets(io);

        if (
            Object.keys(filteredPlayers).length > 0 ||
            Object.keys(filteredFleets).length > 0 ||
            (Bullets && Bullets.length > 0)
        ) {
            const packet = { P: {}, F: {}, B: [], S: {} };

            for (const id in filteredFleets) {
                const f = filteredFleets[id];
                packet.F[id] = [
                    +f.ObjectData.position.x.toFixed(3),
                    +f.ObjectData.position.y.toFixed(3),
                    +f.ObjectData.position.z.toFixed(3),
                    +f.ObjectData.rotation.x.toFixed(3),
                    +f.ObjectData.rotation.y.toFixed(3),
                    +f.ObjectData.rotation.z.toFixed(3),
                    f.ObjectData.lean
                ];
            }

            for (const b of (Bullets || [])) {
                packet.B.push([
                    b.id,
                    +b.position.x.toFixed(3),
                    +b.position.y.toFixed(3),
                    +b.position.z.toFixed(3),
                    +b.direction.x.toFixed(3),
                    +b.direction.y.toFixed(3),
                    +b.direction.z.toFixed(3)
                ]);
            }

            for (const id in Sharks) {
                const s = Sharks[id];
                if (!s || !s.ObjectData) continue;

                packet.S[id] = [
                    +s.ObjectData.position.x.toFixed(3),
                    +s.ObjectData.position.y.toFixed(3),
                    +s.ObjectData.position.z.toFixed(3),
                    s.ObjectData.rotY?.toFixed(3) || 0
                ];
            }

            for (const id in filteredPlayers) {
                const p = filteredPlayers[id];
                if (!p.idle) { // skip idle players
                    packet.P[id] = [
                        +p.ObjectData.position.x.toFixed(3),
                        +p.ObjectData.position.y.toFixed(3),
                        +p.ObjectData.position.z.toFixed(3),
                        +p.ObjectData.rotation.y.toFixed(3),
                        +p.ItemStates.gun.rotation.toFixed(3)
                    ];
                }
            }

            io.to('open_pvp').emit('UPT', packet);

        }

    }, 1000 / tickRate);
}

module.exports = { EngineTicker };
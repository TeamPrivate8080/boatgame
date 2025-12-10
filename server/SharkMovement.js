const { Sharks, Fleets, Players, Islands } = require("./ServerStoring.js");
const { EmulatorHandleMessageChatComposer } = require("./Emulator/EmulatorActions/Emu.ChatComposer.js");

function MoveSharks(io) {
    const now = Date.now();
    const baseSpeed = 0.20;
    const waterLevel = -2.9;
    const worldRadius = 1000;
    const chaseRange = 120;
    const stopDistance = 5;

    for (const id in Sharks) {
        const shark = Sharks[id];
        shark.ObjectData ??= {};
        const od = shark.ObjectData;

        if (!od.position) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * worldRadius * 0.8;
            od.position = {
                x: Math.cos(angle) * dist,
                y: waterLevel,
                z: Math.sin(angle) * dist
            };
        }
        od.rotY ??= Math.random() * Math.PI * 2;
        od.nextTurn ??= now + 4000 + Math.random() * 2000;
        od.turnSpeed ??= 0;

        // random turning
        if (now > od.nextTurn) {
            od.nextTurn = now + 4000 + Math.random() * 3000;
            od.turnSpeed = (Math.random() - 0.5) * 0.06
        }

        od.rotY += od.turnSpeed;

        // Avoid islands softly
        for (const island of Islands) {
            const dx = od.position.x - island.pos.x;
            const dz = od.position.z - island.pos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 140) { // avoid zone radius
                const away = Math.atan2(dx, dz);
                const delta = ((away - od.rotY + Math.PI) % (2 * Math.PI)) - Math.PI;
                od.rotY += delta * 0.15; // correction near island
            }
        }

        // Stay inside map border
        const distToCenter = Math.sqrt(od.position.x ** 2 + od.position.z ** 2);
        if (distToCenter > worldRadius * 0.98) {
            const toCenter = Math.atan2(-od.position.x, -od.position.z);
            const delta = ((toCenter - od.rotY + Math.PI) % (2 * Math.PI)) - Math.PI;
            od.rotY += delta * 0.05;
        }

        // Check nearby fleets to chase
        let closestFleet = null;
        let closestDist = Infinity;

        for (const fid in Fleets) {
            const f = Fleets[fid];
            if (!f?.ObjectData?.sailing) continue;
            const dx = f.ObjectData.position.x - od.position.x;
            const dz = f.ObjectData.position.z - od.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < chaseRange && dist < closestDist) {
                closestFleet = f;
                closestDist = dist;
            }
        }

        // Move
        if (closestFleet) {
            // Chase mode
            const dx = closestFleet.ObjectData.position.x - od.position.x;
            const dz = closestFleet.ObjectData.position.z - od.position.z;
            const desiredRot = Math.atan2(dx, dz);
            const delta = ((desiredRot - od.rotY + Math.PI) % (2 * Math.PI)) - Math.PI;
            od.rotY += delta * 0.1;
        }

        od.position.x += Math.sin(od.rotY) * baseSpeed;
        od.position.z += Math.cos(od.rotY) * baseSpeed;
        od.position.y = waterLevel;

        // Attack fleets if close
        if (closestFleet && closestDist < stopDistance + 5) {
            const f = closestFleet.ObjectGame;
            f.LastSharkDamage ??= 0;
            if (now - f.LastSharkDamage > 1500) {
                const dmg = 30 + Math.floor(Math.random() * 11);
                f.health.amount -= dmg;
                f.LastSharkDamage = now;

                if (f.health.amount <= 0) {
                    closestFleet.ObjectData.sailing = false;
                    EmulatorHandleMessageChatComposer(io, 'str.null', {
                        Message: `${closestFleet.ObjectName} was bitten by a shark and sunk!`,
                        SenderName: 'Server'
                    });
                }

                for (const pid in Players) {
                    const p = Players[pid];
                    if (p.ObjectGame?.inship === closestFleet.ObjectID)
                        io.to(p.ObjectID).emit('net.marker.dmg', { sharkid: 0, damage: dmg, neg: false });
                }

                io.emit('update_ship_health', {
                    fleetid: closestFleet.ObjectID,
                    health: f.health.amount,
                    maxhealth: f.health.max
                });
            }
        }
    }
}

module.exports = { MoveSharks };
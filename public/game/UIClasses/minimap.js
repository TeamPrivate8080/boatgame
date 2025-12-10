import { MachineClient } from '../global.js';

const sharks = MachineClient.ClientStoredSharks
const canvas = document.getElementById('minimap2d');
const ctx = canvas.getContext('2d');

const MAP_RADIUS = 500;
const CANVAS_SIZE = 100;
const CENTER = CANVAS_SIZE / 2;
const ScaleSilencer = 0.62;

function drawArrow(x, y, angle, color, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);

    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(size * 0.6, -size);
    ctx.lineTo(-size * 0.6, -size);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "white";
    ctx.stroke();

    ctx.restore();
}

export function DrawMMap() {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.save();

    const scale = ((CENTER - 8) / MAP_RADIUS) * ScaleSilencer;

    for (const island of MachineClient.ClientIslands) {
        const pos = island.position;
        const name = island.name;

        const x = CENTER + pos.x * scale;
        const y = CENTER + pos.z * scale;
        const islandSize = 11 * ScaleSilencer;

        ctx.beginPath();
        ctx.arc(x, y, islandSize, 0, Math.PI * 2);
        ctx.fillStyle = "#C2B280";
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.font = `bold ${14 * ScaleSilencer}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 2;
        ctx.fillText(name, x, y - islandSize - 10 * ScaleSilencer);
        ctx.shadowBlur = 0; // reset shadow
    }


    for (const fleetId in MachineClient.ClientStoredRafts) {
        const fleet = MachineClient.ClientStoredRafts[fleetId];
        const pos = fleet.targetPos;
        const rot = fleet.targetRot?.y || 0;

        const x = CENTER + pos.x * scale;
        const y = CENTER + pos.z * scale;
        const arrowRot = -rot;

        drawArrow(x, y, arrowRot, "rgba(180,180,180,1)", 10 * ScaleSilencer);
    }

    for (const id in MachineClient.ClientStoredCrates) {
        const crate = MachineClient.ClientStoredCrates[id];
        if (!crate) continue;

        const pos = crate.position;
        const x = CENTER + pos.x * scale;
        const y = CENTER + pos.z * scale;
        const size = 3 * ScaleSilencer;

        ctx.fillStyle = "rgba(139,69,19,0.9)"; 
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.strokeRect(x - size / 2, y - size / 2, size, size);
    }

    const compassDistance = 55 * ScaleSilencer;
    const directions = [
        { label: "N", x: 0, y: -0.5 },
        { label: "E", x: 0.5, y: 0 },
        { label: "S", x: 0, y: 0.5 },
        { label: "W", x: -0.5, y: 0 }
    ];

    ctx.fillStyle = "white";
    ctx.font = `bold ${17 * ScaleSilencer}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 2;

    directions.forEach(dir => {
        const dx = CENTER + dir.x * compassDistance;
        const dy = CENTER + dir.y * compassDistance;
        ctx.fillText(dir.label, dx, dy);
    });
    ctx.shadowBlur = 0; // reset shadow

    const local = MachineClient.ClientStoredPlayers[MachineClient.ClientStoredClientID];
    const fleet = MachineClient.ClientStoredRafts[MachineClient.ClientStoredClientID];
    const docked = MachineClient.ClientDocked === true;

    if (local && local.obj) {
        let worldX, worldZ, worldRot;

        if (docked || !fleet) {
            worldX = local.obj.position.x;
            worldZ = local.obj.position.z;
            worldRot = local.obj.rotation.y;
        } else {
            const playerLocalPos = local.obj.position;
            const fleetWorldPos = fleet.targetPos;
            const fleetWorldRot = fleet.targetRot?.y || 0;

            worldX = fleetWorldPos.x + playerLocalPos.x;
            worldZ = fleetWorldPos.z + playerLocalPos.z;
            worldRot = fleetWorldRot + local.obj.rotation.y;
        }

        const px = CENTER + worldX * scale;
        const py = CENTER + worldZ * scale;
        const arrowRot = -worldRot + Math.PI / 2;

        drawArrow(px, py, arrowRot, "rgba(255, 255, 255, 1)", 6 * ScaleSilencer);
    }

    ctx.restore();
}
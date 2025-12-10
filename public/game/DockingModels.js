import { MachineClient } from "./global.js";
import * as THREE from 'three';

let ePressed = false;

window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "e" && !ePressed) {
        ePressed = true;
        MachineClient.ClientNetPeer.emit('depart')
    }
});

window.addEventListener("keyup", (e) => {
    if (e.key.toLowerCase() === "e") {
        ePressed = false;
    }
});

export function ThrowWelcomeIsland(Island) {
    const popup = document.getElementById('island-welcome');
    popup.innerHTML = 'WELCOME TO ' + Island;
    popup.classList.add('show');
    setTimeout(() => {
        popup.classList.remove('show');
    }, 4000);
}

export function SetFleetTransparency(id, transparent) {
    const FleetDest = MachineClient.ClientStoredRafts[id];
    if (!FleetDest || !FleetDest.obj) return;

    const FleetMainModel = FleetDest.obj.getObjectByName("fleet");
    if (!FleetMainModel) return;

    FleetMainModel.traverse((child) => {
        if (!child.isMesh) return;

        const meshName = (child.name || "").toLowerCase();
        const materials = Array.isArray(child.material) ? child.material : [child.material];

        let isSail = meshName.includes("sail");

        materials.forEach(mat => {
            const matName = (mat.name || "").toLowerCase();
            if (matName.includes("sail")) isSail = true;
        });

        materials.forEach((mat, i) => {
            if (mat.isShaderMaterial) return;

            if (isSail) {
                mat.transparent = true;
                mat.opacity = 0.55;
                mat.depthWrite = false;
                mat.alphaTest = 0.01;
                mat.side = THREE.DoubleSide;
                mat.fog = true;

                if ("metalness" in mat) mat.metalness = 0;
                if ("roughness" in mat) mat.roughness = 1;
                mat.envMap = null;
            }


            else {
                if (transparent) {
                    mat.transparent = true;
                    mat.opacity = 0.3;
                    mat.depthWrite = false;
                    child.renderOrder = 5;
                } else {
                    mat.transparent = false;
                    mat.opacity = 1;
                    mat.depthWrite = true;
                    child.renderOrder = 0;
                }
            }

            mat.needsUpdate = true;
        });

        child.material = Array.isArray(child.material) ? materials : materials[0];
    });

    if (transparent) ShowDepartIndicator(id);
    else HideDepartIndicator(id);
}



export function ShowDepartIndicator(id) {
    const fleetEntry = MachineClient.ClientStoredRafts[id];
    if (!fleetEntry || !fleetEntry.obj) return;

    const fleetObj = fleetEntry.obj;
    const existing = fleetObj.getObjectByName("DepartIndicator");
    if (existing) return; // already showing

    const size = 256;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.height = size;

    ctx.fillStyle = "rgba(13, 222, 230, 0.85)"; // coral tone
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#b43838ff";
    ctx.font = "bold 110px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("E", size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.name = "DepartIndicator";
    sprite.scale.set(2, 2, 1);      // adjust for your world scale
    sprite.position.set(-2.5, 3, 0);   // float slightly above the ship
    sprite.renderOrder = 9;        // << Always render on top

    fleetObj.add(sprite);


    sprite.onBeforeRender = () => {
        sprite.quaternion.copy(MachineClient.ClientCamera.quaternion);
    };

    // Store animation data for render loop
    MachineClient.DepartIndicators.set(id, {
        sprite,
        baseScale: sprite.scale.clone(),
        pulse: Math.random() * Math.PI * 2 // random offset for variety
    });
}

export function HideDepartIndicator(id) {
    const fleetEntry = MachineClient.ClientStoredRafts[id];
    if (!fleetEntry || !fleetEntry.obj) return;

    const fleetObj = fleetEntry.obj;
    const sprite = fleetObj.getObjectByName("DepartIndicator");
    if (sprite) {
        sprite.material.map.dispose();
        sprite.material.dispose();
        fleetObj.remove(sprite);
    }
    MachineClient.DepartIndicators.delete(id);
}

export function UpdateDepartIndicators(deltaTime = 0.016) {
    for (const [id, data] of MachineClient.DepartIndicators) {
        const { sprite, baseScale } = data;
        if (!sprite.parent) {
            MachineClient.DepartIndicators.delete(id);
            continue;
        }
        data.pulse += deltaTime * 3; // pulse speed
        const s = 1 + Math.sin(data.pulse) * 0.1;
        sprite.scale.set(baseScale.x * s, baseScale.y * s, 1);
    }
}
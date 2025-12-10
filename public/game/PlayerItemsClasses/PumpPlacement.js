import { MachineClient } from '../global.js';
import { ModelCache } from '../Loaders/preloader.js'
import * as THREE from 'three';

export let PumpPreview = null;
export let PumpEquipped = false;

MachineClient.ClientNetPeer.on('EquipPump', () => {
    if (!ModelCache['pump']) return;

    PumpPreview = ModelCache['pump'].clone();
    PumpPreview.traverse(child => {
        if (child.isMesh) {
            child.material = child.material.clone();
            child.material.transparent = true;
            child.material.opacity = 0.2;
        }
    });
    MachineClient.GlobalDefineWorld.add(PumpPreview);
    PumpEquipped = true;

    RunPumpRaycast();
});

MachineClient.ClientNetPeer.on('DeletePump', () => {
    if (PumpPreview) {
        MachineClient.GlobalDefineWorld.remove(PumpPreview);
        PumpPreview = null;
    }

    PumpEquipped = false;
});

export function RunPumpRaycast() {
    const mouse = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, MachineClient.ClientCamera);

    const waterPlane = new THREE.Plane(new THREE.Vector3(0, 2, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(waterPlane, intersection);

    if (intersection) {
        const maxRange = 40;
        const camPos = MachineClient.ClientCamera.getWorldPosition(new THREE.Vector3());

        const distance = camPos.distanceTo(intersection);
        if (distance > maxRange) {
            const direction = intersection.clone().sub(camPos).normalize();
            intersection.copy(
                camPos.clone().add(direction.multiplyScalar(maxRange))
            );

            intersection.y = -2;
        }

        const gridSnap = 0.1;
        intersection.x = Math.round(intersection.x / gridSnap) * gridSnap;
        intersection.z = Math.round(intersection.z / gridSnap) * gridSnap;

        PumpPreview.position.copy(intersection);
        PumpPreview.position.y = -2;
    }
}

function PlacePump(p) {
    if (!ModelCache['pump']) return;

    const { position, rotation, health, id } = p;

    if (MachineClient.ClientStoredPumps.some(stored => stored.id === id)) {
        return;
    }

    const pump = ModelCache['pump'].clone();
    pump.traverse(child => {
        if (child.isMesh) {
            child.material = child.material.clone();
            child.material.transparent = false;
            child.material.opacity = 1;
        }
    });

    pump.position.set(position.x, position.y, position.z);
    pump.rotation.set(rotation._x, rotation._y, rotation._z, rotation._order);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#222222';
    ctx.font = 'bold 36px Verdana';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${health} / ${health}`, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: true, depthWrite: false }));
    sprite.scale.set(4, 1, 1);
    sprite.position.set(0, 6, 0);
    pump.add(sprite);

    pump.userData.health = health;
    pump.userData.maxHealth = health;
    pump.userData.healthSprite = sprite;

    MachineClient.GlobalDefineWorld.add(pump);

    if (!MachineClient.ClientStoredPumps) MachineClient.ClientStoredPumps = [];
    MachineClient.ClientStoredPumps.push({
        id,
        position: { ...position },
        rotation: { ...rotation },
        health,
        maxHealth: health,
        mesh: pump,
        sprite
    });
}

MachineClient.ClientNetPeer.on('PlacePump', (p) => PlacePump(p));

MachineClient.ClientNetPeer.on('PlacePumps', (arr) => {
    if (!Array.isArray(arr)) return;
    arr.forEach(PlacePump);
});

MachineClient.ClientNetPeer.on('update_pump_health', (payload) => {
    if (!MachineClient.ClientStoredPumps) return;

    const { id, health } = payload;
    const TargetHealth = Math.round(health);

    const PumpData = MachineClient.ClientStoredPumps.find(p => p.id === id);
    if (!PumpData) {
        console.warn(`Pump with id ${id} not found on client.`);
        return;
    }

    PumpData.health = TargetHealth;

    const sprite = PumpData.sprite;
    if (sprite && sprite.material.map) {
        const canvas = sprite.material.map.image;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#222222';
        ctx.font = 'bold 36px Verdana';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${TargetHealth} / ${PumpData.maxHealth}`, canvas.width / 2, canvas.height / 2);

        sprite.material.map.needsUpdate = true;
    }

    if (PumpData.mesh) {
        PumpData.mesh.userData.health = TargetHealth;
        if (PumpData.mesh.userData.healthSprite) {
            PumpData.mesh.userData.healthSprite = sprite;
        }
    }

});

MachineClient.ClientNetPeer.on('DeletePumps', (IDsArray) => {
    if (!Array.isArray(IDsArray) || !MachineClient.ClientStoredPumps) return;

    IDsArray.forEach(id => {
        const index = MachineClient.ClientStoredPumps.findIndex(p => p.id === id);
        if (index !== -1) {
            const pumpData = MachineClient.ClientStoredPumps[index];

            if (pumpData.mesh) {
                MachineClient.GlobalDefineWorld.remove(pumpData.mesh);
            }

            MachineClient.ClientStoredPumps.splice(index, 1);
        }
    });
});
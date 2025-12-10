import * as THREE from 'three';
import './Loaders/preloader.js';
import './net.js';
import { MachineClient, UpdateStates } from './global.js';
import './keytriggers.js';
import './UIClasses/UIShoppingClass.js';
import './UIClasses/marketplace.js'
import './UIClasses/Quests.js';
import './menu/menu.js';
import './audio/audio_preloader.js'
import './UIClasses/ChatModel.js';
import './PlayerItemsClasses/FishingRod.js';
import './UIClasses/HitModel.js';
import './ui.worker.js';
import './UIClasses/alert.js'
import './UIClasses/ShipStatus.js'
import './ServerStates/CratesModal.js';
import { DrawMMap } from './UIClasses/minimap.js';
import { SetupShootModel } from './PlayerItemsClasses/ShootModel.js';
import { NewWater } from './world1.js';
import { UpdateCompass } from './UIClasses/compass.js';
import { RenderFishingHooks } from './PlayerItemsClasses/FishingRod.js';
import { ThrowPing } from './net.js';
import { water } from './world1.js'
import { UpdateDepartIndicators } from './DockingModels.js'
import { UpdateBulletSplash, CreateBulletSplash } from './ItemClasses/BulletClass.js'
import { RunPumpRaycast, PumpEquipped, PumpPreview } from './PlayerItemsClasses/PumpPlacement.js'

let keys = {};
let camDistance = 3
let camHeight = 3;
let camYaw = 0;
let camPitch = 0.9;
const minPitch = -Math.PI / 2 + 0.1;
const maxPitch = Math.PI / 2 - 0.11;

const minDistance = 3, maxDistance = 4;

init()
function init() {
    MachineClient.GlobalDefineWorld = new THREE.Scene();
    MachineClient.GlobalDefineWorld.background = new THREE.Color(0x87ceeb);

    MachineClient.ClientCamera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 500);

    MachineClient.ClientRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        depth: true,
        stencil: false,
        powerPreference: "high-performance",
        logarithmicDepthBuffer: false,
        preserveDrawingBuffer: false
    });

    MachineClient.ClientRenderer.setSize(window.innerWidth, window.innerHeight);
    MachineClient.ClientRenderer.setPixelRatio(1);
    MachineClient.ClientRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    MachineClient.ClientRenderer.toneMappingExposure = 1.1;
    MachineClient.ClientRenderer.physicallyCorrectLights = false;
    MachineClient.ClientRenderer.shadowMap.enabled = false;
    MachineClient.ClientRenderer.outputEncoding = THREE.LinearEncoding;
    MachineClient.ClientRenderer.info.autoReset = false;

    document.body.appendChild(MachineClient.ClientRenderer.domElement);

    if (MachineClient.ClientRenderer.domElement)
        MachineClient.ClientRenderer.domElement.setAttribute('data-engine', 'WebGL');


    SetupShootModel();

    MachineClient.ClientRenderer.domElement.addEventListener('click', () => {
        if (MachineClient.ClientMenu === true) return;
        document.body.requestPointerLock();
    });

    let LastMouseEmit = 0;

    document.addEventListener('mousemove', e => {
        if (MachineClient.ClientMenu === true) return;
        if (document.pointerLockElement !== document.body) return;

        const local = MachineClient.ClientStoredPlayers[MachineClient.ClientStoredClientID];
        if (!local) return;

        camYaw -= e.movementX * 0.0011;
        camPitch += e.movementY * 0.0011;
        camPitch = Math.max(minPitch, Math.min(maxPitch, camPitch));


        local.obj.rotation.y = camYaw;

        if (local.CannonObj) {
            const camDir = new THREE.Vector3();
            MachineClient.ClientCamera.getWorldDirection(camDir);

            const playerQuat = local.obj.getWorldQuaternion(new THREE.Quaternion());
            const invQuat = playerQuat.clone().invert();
            const localDir = camDir.clone().applyQuaternion(invQuat);

            let cannonPitch = Math.asin(localDir.y);

            const cannonPitchOffset = 0.4; // increase this for higher aim
            cannonPitch += cannonPitchOffset;

            local.CannonObj.rotation.x = cannonPitch;
            local.CannonObj.rotation.y = 0;
        }


        if (local.rodObj) {
            const camDir = new THREE.Vector3();
            MachineClient.ClientCamera.getWorldDirection(camDir);

            // convert camera direction to local player space
            const playerQuat = local.obj.getWorldQuaternion(new THREE.Quaternion());
            const invQuat = playerQuat.clone().invert();
            const localDir = camDir.clone().applyQuaternion(invQuat);

            // compute pitch in radians
            let rodPitch = Math.asin(localDir.y);

            // offset so rod points slightly forward
            const pitchOffset = 0.05;
            rodPitch += pitchOffset;

            // clamp rod pitch so it doesn't rotate too far
            const minRodPitch = -0.5;
            const maxRodPitch = 0.6;
            rodPitch = Math.max(minRodPitch, Math.min(maxRodPitch, rodPitch));

            local.rodObj.rotation.x = rodPitch;
        }

        if (PumpEquipped && PumpPreview) {
            RunPumpRaycast();
        }

        const now = performance.now();
        if (now - LastMouseEmit > 50) {
            LastMouseEmit = now;

            MachineClient.ClientNetPeer.emit('MMV', {
                yaw: local.obj.rotation.y,
                GRot: local.CannonObj ? local.CannonObj.rotation.x : 0
            });
        }
    });


    document.addEventListener('wheel', (e) => {
        if (document.pointerLockElement !== document.body) return;
        camDistance += e.deltaY * 0.002;
        camDistance = Math.max(minDistance, Math.min(maxDistance, camDistance));
    }, { passive: true });


    window.addEventListener('keydown', e => keys[e.code] = true);
    window.addEventListener('keyup', e => keys[e.code] = false);
}




window.addEventListener('resize', () => {
    MachineClient.ClientCamera.aspect = innerWidth / innerHeight;
    MachineClient.ClientCamera.updateProjectionMatrix();
    MachineClient.ClientRenderer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();
let last = 0;
let ThisFPS = 0;
let FPSTIME = performance.now();

const PlayerWorldPos = new THREE.Vector3();
const tempVec = new THREE.Vector3();
const tempQuat = new THREE.Quaternion();
const lookTarget = new THREE.Vector3();

export function animate() {
    const timeNow = performance.now() * 0.001;

    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    last += delta;

    if (water) water.material.uniforms['time'].value += delta / 6;

    UpdateDepartIndicators(delta);
    UpdateBulletSplash(delta)
    RenderFishingHooks();

    if (MachineClient.CloudLayer && MachineClient.ClientCamera) {
        const cam = MachineClient.ClientCamera;
        cam.getWorldPosition(PlayerWorldPos);

        const cloudLayer = MachineClient.CloudLayer;
        cloudLayer.position.x = PlayerWorldPos.x;
        cloudLayer.position.z = PlayerWorldPos.z;

        const children = cloudLayer.children;
        const maxDist = 1000;
        const maxDist2 = maxDist * 2;

        for (let i = 0, len = children.length; i < len; i++) {
            const cloud = children[i];
            const ud = cloud.userData;

            if (!ud.initialized) {
                ud.speedX = 0.03 + Math.random() * 0.06;
                ud.speedZ = 0.02 + Math.random() * 0.03;
                ud.floatOffset = Math.random() * Math.PI * 2;
                ud.initialized = true;
            }

            cloud.position.x += ud.speedX;
            cloud.position.z += ud.speedZ;

            cloud.position.x = ((cloud.position.x + maxDist) % maxDist2) - maxDist;
            cloud.position.z = ((cloud.position.z + maxDist) % maxDist2) - maxDist;
        }
    }


    const interval = 1 / 65;
    if (last < interval) return;
    last = 0;

    if (NewWater) {
        const horizontalAmplitude = 2;
        const horizontalSpeed = 0.9;
        NewWater.position.x = Math.floor(Math.sin(timeNow * horizontalSpeed) * horizontalAmplitude * 1000) / 1000;

        const verticalAmplitude = 0.1;
        const verticalSpeed = 1.2;
        const baseY = -2.4;
        NewWater.position.y = baseY + Math.floor(Math.sin(timeNow * verticalSpeed) * verticalAmplitude * 1000) / 1000;
    }

    const now = performance.now();
    ThisFPS++;
    if (now - FPSTIME >= 500) {
        ThisFPS = 0;
        FPSTIME = now;

        if (MachineClient.FogBoundary && MachineClient.ClientCamera) {
            MachineClient.ClientCamera.getWorldPosition(PlayerWorldPos);
            const boundary = MachineClient.FogBoundary;
            boundary.position.x = PlayerWorldPos.x;
            boundary.position.z = PlayerWorldPos.z;
        }

        ThrowPing();
    }

    if (now - UpdateStates.MinimapUpdate > 1000 / 8) {
        DrawMMap();
        UpdateStates.MinimapUpdate = now;
    }

    const maxStep = 5;
    const dt = Math.min(delta, maxStep);

    const localPlayer = MachineClient.ClientStoredPlayers[MachineClient.ClientStoredClientID];
    if (localPlayer && localPlayer.obj) {
        localPlayer.obj.getWorldPosition(PlayerWorldPos); // reuse
    }

    // Update players
    for (const id in MachineClient.ClientStoredPlayers) {
        const player = MachineClient.ClientStoredPlayers[id];
        const obj = player.obj;
        const targetPos = player.targetPos;
        if (!obj || !targetPos) continue;

        const distance = obj.position.distanceTo(targetPos);
        const lerpFactor = Math.min(1, Math.max(0.35, distance * 5 * dt));
        obj.position.lerp(targetPos, lerpFactor);


        if (player.CannonObj && id !== MachineClient.ClientStoredClientID) {
            if (player.TargetGunRotationStateX === undefined) player.TargetGunRotationStateX = player.CannonObj.rotation.x;
            player.CannonObj.rotation.x = THREE.MathUtils.lerp(player.CannonObj.rotation.x, player.TargetGunRotationStateX, 0.3);
        }


        if (id === MachineClient.ClientStoredClientID && now - UpdateStates.CompassUpdate >= 100) {
            UpdateStates.CompassUpdate = now;
            obj.getWorldQuaternion(tempQuat);
            const euler = new THREE.Euler().setFromQuaternion(tempQuat, 'YXZ');
            UpdateCompass(euler.y);
        }
    }

    const MAX_LEAN = 0.09;
    const WAVE_ANGLE = 0.012;
    const WAVE_SPEED = 1.0;
    const TWO_PI = Math.PI * 2;

    const time = performance.now() * 0.001;

    for (const id in MachineClient.ClientStoredRafts) {
        const fleet = MachineClient.ClientStoredRafts[id];
        const obj = fleet.obj;
        const targetPos = fleet.targetPos;
        const targetRot = fleet.targetRot;
        const leanDir = fleet.lean;

        if (!obj || !targetPos || !targetRot) continue;

        const dx = obj.position.x - PlayerWorldPos.x;
        const dz = obj.position.z - PlayerWorldPos.z;
        if ((dx * dx + dz * dz) > 160000) continue;

        // Smooth root interpolation
        obj.position.x += (targetPos.x - obj.position.x) * 0.1;
        obj.position.y += (targetPos.y - obj.position.y) * 0.1;
        obj.position.z += (targetPos.z - obj.position.z) * 0.1;

        // Smooth root rotation
        let ry = targetRot.y - obj.rotation.y;
        ry = ((ry + Math.PI) % TWO_PI) - Math.PI;
        obj.rotation.y += ry * 0.08;

        // mesh only
        const mesh = obj.getObjectByName("fleet");
        if (mesh) {
            let targetLean = 0;
            if (leanDir === 'left') targetLean = MAX_LEAN;
            else if (leanDir === 'right') targetLean = -MAX_LEAN;

            mesh.userData.leanX = mesh.userData.leanX ?? mesh.rotation.x;
            mesh.userData.leanX += (targetLean - mesh.userData.leanX) * 0.02;

            if (mesh.userData.baseRotationX === undefined) {
                mesh.userData.baseRotationX = mesh.rotation.x;
                mesh.userData.baseRotationZ = mesh.rotation.z;
            }

            const numericId = parseInt(id, 10) || 0;

            const waveX = Math.sin(time * WAVE_SPEED + numericId) * WAVE_ANGLE;
            const waveZ = Math.cos(time * WAVE_SPEED + numericId) * WAVE_ANGLE;

            mesh.rotation.x = mesh.userData.baseRotationX + mesh.userData.leanX + waveX;
            mesh.rotation.z = mesh.userData.baseRotationZ + waveZ;
        }
    }




    for (const id in MachineClient.ClientStoredSharks) {
        const shark = MachineClient.ClientStoredSharks[id];
        const obj = shark.obj;
        const targetPos = shark.targetPos;
        const targetDir = shark.rotationY;
        if (!obj || !targetPos || targetDir === undefined || !PlayerWorldPos) continue;

        const distanceToPlayer = obj.position.distanceTo(PlayerWorldPos);
        if (distanceToPlayer > 400) continue;

        const distance = obj.position.distanceTo(targetPos);
        obj.position.lerp(targetPos, Math.min(1, Math.max(0.2, distance * 4 * dt)));

        obj.rotation.y += (((targetDir - obj.rotation.y + Math.PI) % (2 * Math.PI)) - Math.PI) * 0.15;
    }

    const camera = MachineClient.ClientCamera;
    if (localPlayer && localPlayer.obj) {
        const cosP = Math.cos(camPitch);
        const sinP = Math.sin(camPitch);

        tempVec.set(
            Math.sin(camYaw) * camDistance * cosP,
            camHeight + sinP * camDistance,
            Math.cos(camYaw) * camDistance * cosP
        );

        camera.position.copy(localPlayer.obj.position).add(tempVec);

        localPlayer.obj.getWorldPosition(lookTarget);
        lookTarget.y += 2;
        camera.lookAt(lookTarget);
    } else if (camera) {
        const t = performance.now() * 0.0003;
        const r = 90 + Math.sin(t * 0.8) * 40;
        const y = 25 + Math.sin(t * 2.5) * 10;
        camera.position.set(Math.cos(t) * r, y, Math.sin(t) * r);
        camera.lookAt(0, 15, 0);
    }

    const bullets = MachineClient.ClientStoredBullets;
    const trailHistoryLength = 12;

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];

        const distanceToPlayer = b.mesh.position.distanceTo(PlayerWorldPos);
        if (distanceToPlayer > 400) continue;

        if (b.type === 'cannonball' && b.mesh.position.y <= -2 && !b.splashed) {
            b.splashed = true;
            CreateBulletSplash(b.mesh.position.clone());
        }


        b.mesh.position.lerp(b.targetPos, 0.22);

        if (!b.trailHistory) b.trailHistory = [];
        b.trailHistory.unshift(b.mesh.position.clone());
        if (b.trailHistory.length > trailHistoryLength)
            b.trailHistory.pop();

        b.flameTimer += 0.15;

        for (let j = 0; j < b.flameMeshes.length; j++) {
            const flame = b.flameMeshes[j];
            const historyIndex = Math.floor((j / b.flameMeshes.length) * b.trailHistory.length);
            const trailPos = b.trailHistory[historyIndex] || b.mesh.position;

            flame.position.lerp(trailPos, 0.5);

            const pulse = 1 + Math.sin(b.flameTimer * 4 + j * 0.7) * 0.12;
            const baseScale = 1.2 - j / b.flameMeshes.length;
            flame.scale.setScalar(baseScale * pulse);

            const t = j / b.flameMeshes.length;
            const startColor = new THREE.Color(0xff5028);
            const endColor = new THREE.Color(0x300000);
            const color = new THREE.Color().lerpColors(startColor, endColor, t);

            flame.material.color.copy(color);
            flame.material.emissive.copy(color);
            flame.material.emissiveIntensity = 2.8 - t * 1.6;
            flame.material.opacity = 0.95 - t * 0.08;
        }

        if (b.mesh.position.length() > 2000) {
            if (b.mesh.parent) b.mesh.parent.remove(b.mesh);
            for (const f of b.flameMeshes) {
                if (f.parent) f.parent.remove(f);
                f.geometry.dispose();
                f.material.dispose();
            }
            b.mesh.geometry.dispose();
            b.mesh.material.dispose();
            bullets.splice(i, 1);
        }
    }


    for (const id in MachineClient.ClientStoredCrates) {
        const crate = MachineClient.ClientStoredCrates[id];
        if (!crate || !localPlayer) continue;

        const distanceToPlayer = crate.position.distanceTo(PlayerWorldPos);
        if (distanceToPlayer > 400) continue;

        crate.rotation.x += 2.0 / 150.0;
        crate.rotation.z += 2.0 / 150.0;
    }


    MachineClient.ClientRenderer.render(MachineClient.GlobalDefineWorld, camera);
}
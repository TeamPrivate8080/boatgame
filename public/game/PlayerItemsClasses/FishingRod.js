import * as THREE from 'three';
import { MachineClient } from "../global.js";
import { ModelCache } from "../Loaders/preloader.js";
import { PlaySound } from '../audio/audio_player.js';

const FISH_LIFETIME = 3000; // 3s client lifetime safety

export function ThrowRod(HPlayerID, StartPos, direction) {
    const scene = MachineClient.GlobalDefineWorld;
    const MyPlayer = MachineClient.ClientStoredPlayers[HPlayerID];
    if (!MyPlayer) return;

    const RopeSegmts = 5;
    const RopeNewPoints = [];
    let IsHookStopped = false;

    const ballRadius = 0.12;
    const hook = new THREE.Mesh(
        new THREE.SphereGeometry(ballRadius, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    hook.position.copy(StartPos);
    scene.add(hook);

    for (let i = 0; i <= RopeSegmts; i++)
        RopeNewPoints.push(new THREE.Vector3(0, 0, 0));

    const AttachPar = MyPlayer.rodObj && MyPlayer.rodObj.isObject3D
        ? MyPlayer.rodObj
        : MyPlayer.obj;

    const RopeMesh = new THREE.Mesh(
        new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(RopeNewPoints),
            RopeSegmts * 5,
            0.01,
            8,
            false
        ),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );

    AttachPar.add(RopeMesh);
    RopeMesh.position.set(0, 0, 0);

    const RodTipOffset = new THREE.Vector3(0, 3.07, -2.2);

    const ThrowDirection = direction.clone().normalize();
    const CamDireciton = new THREE.Vector3();
    MachineClient.ClientCamera.getWorldDirection(CamDireciton);

    ThrowDirection.y += 0.2 + THREE.MathUtils.clamp(CamDireciton.y, -0.5, 1) * 0.8;
    ThrowDirection.normalize();

    const HookVel = ThrowDirection.clone().multiplyScalar(0.75 * 1 + Math.max(0, Math.asin(ThrowDirection.y) / (Math.PI / 2)) * 0.5);

    const hookData = {
        HPlayerID,
        hook,
        RopeMesh,
        RopeNewPoints,
        RopeSegmts,
        HookVel,
        IsHookStopped,
        ballRadius,
        MyPlayer,
        RodTipOffset,
        reward: null,
        createdAt: Date.now(),  // track when it was thrown
    };

    MachineClient.ActiveFishingHooks.push(hookData);
    MyPlayer.activeRodData = hookData;
}

export function PullRope(PlayerID) {
    for (let i = MachineClient.ActiveFishingHooks.length - 1; i >= 0; i--) {
        const HookData = MachineClient.ActiveFishingHooks[i];

        if (HookData.HPlayerID === PlayerID) {

            if (HookData.reward) {
                const { object, bubbles } = HookData.reward;

                if (object?.parent) object.parent.remove(object);
                bubbles?.forEach(b => {
                    if (b.parent) b.parent.remove(b);
                    b.geometry.dispose();
                    b.material.dispose();
                });
                HookData.reward = null;
            }

            if (HookData.hook?.parent) {
                HookData.hook.parent.remove(HookData.hook);
                HookData.hook.geometry.dispose();
                HookData.hook.material.dispose();
            }

            if (HookData.RopeMesh?.parent) {
                HookData.RopeMesh.parent.remove(HookData.RopeMesh);
                HookData.RopeMesh.geometry.dispose();
                HookData.RopeMesh.material.dispose();
            }

            MachineClient.ActiveFishingHooks.splice(i, 1);
        }
    }
}

export function FishOutCube(PlayerID) {
    const hookData = MachineClient.ActiveFishingHooks.find(h => h.HPlayerID === PlayerID);
    if (!hookData) return;

    const FishModel = ModelCache["Fish1"];
    if (!FishModel) {
        console.warn("Fish model not loaded yet!");
        return;
    }

    const scene = MachineClient.GlobalDefineWorld;

    const fish = FishModel.clone();
    fish.position.copy(hookData.hook.position);
    fish.scale.set(0.1, 0.1, 0.1);
    scene.add(fish);

    const bubbleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const bubbleMaterial = new THREE.MeshStandardMaterial({ color: 'white', transparent: true, opacity: 0.7 });
    const bubbles = [];
    for (let i = 0; i < 8; i++) {
        const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial.clone());
        bubble.position.copy(fish.position);
        bubble.position.x += (Math.random() - 0.5) * 2;
        bubble.position.z += (Math.random() - 0.5) * 2;
        scene.add(bubble);
        bubbles.push(bubble);
    }

    if (hookData.MyPlayer?.obj) {
        const playerPos = new THREE.Vector3();
        hookData.MyPlayer.obj.getWorldPosition(playerPos);
        const distance = fish.position.distanceTo(playerPos);
        const minDistance = 5;
        const maxDistance = 70;
        let volume = 1;
        if (distance <= minDistance) volume = 1;
        else if (distance >= maxDistance) volume = 0;
        else {
            const t = (distance - minDistance) / (maxDistance - minDistance);
            volume = 1 - Math.pow(t, 0.5);
        }
        PlaySound('blub', volume);
    }

    hookData.reward = {
        object: fish,
        bubbles,
        frame: 0,
        totalFrames: 30,
        timer: 0,
        maxTime: 100,
        spawnTime: Date.now(),
    };

    hookData.IsHookStopped = true;
}
export function RenderFishingHooks() {
    for (let i = MachineClient.ActiveFishingHooks.length - 1; i >= 0; i--) {
        const h = MachineClient.ActiveFishingHooks[i];
        const { hook, RopeMesh, RopeNewPoints, RopeSegmts, MyPlayer, RodTipOffset, HookVel } = h;

        if (!RopeMesh.parent || !hook.parent || !MyPlayer) {
            PullRope(h.HPlayerID);
            continue;
        }

        if (!h.IsHookStopped) {
            HookVel.add(new THREE.Vector3(0, -0.02, 0));
            hook.position.add(HookVel);

            if (hook.position.y <= -2) {
                hook.position.y = -2;
                h.IsHookStopped = true;

                if (!h.blubPlayed) {
                    h.blubPlayed = true;

                    let volume = 1;
                    if (MyPlayer.obj) {
                        const playerPos = new THREE.Vector3();
                        MyPlayer.obj.getWorldPosition(playerPos);
                        const distance = hook.position.distanceTo(playerPos);
                        const minDistance = 5;
                        const maxDistance = 70;
                        if (distance <= minDistance) volume = 1;
                        else if (distance >= maxDistance) volume = 0;
                        else {
                            const t = (distance - minDistance) / (maxDistance - minDistance);
                            volume = 1 - Math.pow(t, 0.5);
                        }
                    }

                    PlaySound('blub', volume);
                }
            }
        }


        if (MyPlayer.rodObj && MyPlayer.fishing) {
            const time = performance.now() * 0.002;
            MyPlayer.rodObj.rotation.x = Math.sin(time) * 0.05;
            MyPlayer.rodObj.rotation.z = Math.sin(time * 0.7) * 0.03;
        }


        const attachParent = MyPlayer.rodObj && MyPlayer.rodObj.isObject3D
            ? MyPlayer.rodObj
            : MyPlayer.obj;

        const rodTipWorld = RodTipOffset.clone();
        attachParent.localToWorld(rodTipWorld);

        const ropePointsWorld = [];
        for (let j = 0; j <= RopeSegmts; j++) {
            const t = j / RopeSegmts;
            const point = new THREE.Vector3().lerpVectors(rodTipWorld, hook.position, t);
            if (j > 0 && j < RopeSegmts) point.y -= Math.sin(Math.PI * t) * 2; // rope sag
            ropePointsWorld.push(point);
        }

        for (let j = 0; j <= RopeSegmts; j++) {
            RopeNewPoints[j].copy(RopeMesh.parent.worldToLocal(ropePointsWorld[j].clone()));
        }

        RopeMesh.geometry.dispose();
        RopeMesh.geometry = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(RopeNewPoints),
            RopeSegmts * 5,
            0.01,
            8,
            false
        );


        if (h.reward) {
            const r = h.reward;
            if (!RopeMesh.parent || Date.now() - r.spawnTime > FISH_LIFETIME) {
                PullRope(h.HPlayerID);
                continue;
            }

            r.frame++;
            const scale = Math.sin((r.frame / r.totalFrames) * Math.PI) + 0.2;
            r.object.scale.setScalar(scale);

            if (r.object && MyPlayer?.rodObj) {
                const rodTipWorld = new THREE.Vector3();
                MyPlayer.rodObj.getWorldPosition(rodTipWorld);
                const dirToPlayer = rodTipWorld.clone().sub(r.object.position).normalize();
                const distance = r.object.position.distanceTo(rodTipWorld);
                const speed = THREE.MathUtils.clamp(distance * 0.15, 0.02, 0.6);
                r.object.position.add(dirToPlayer.multiplyScalar(speed));
                r.object.lookAt(rodTipWorld);
            }

            r.bubbles.forEach(b => {
                b.position.y += 0.003 + Math.random() * 0.01;
                b.material.opacity -= 0.005;
            });

            const lifetimeExpired = Date.now() - r.spawnTime > FISH_LIFETIME;
            const reachedPlayer = MyPlayer?.rodObj && r.object?.position.distanceTo(MyPlayer.rodObj.getWorldPosition(new THREE.Vector3())) < 0.5;

            if (lifetimeExpired || reachedPlayer) {
                if (r.object?.parent) r.object.parent.remove(r.object);
                r.bubbles.forEach(b => {
                    if (b.parent) b.parent.remove(b);
                    b.geometry.dispose();
                    b.material.dispose();
                });
                r.object.geometry?.dispose?.();
                r.object.material?.dispose?.();
                r.object = null;
                h.reward = null;
                PullRope(h.HPlayerID);
            }

            if (r.frame >= r.totalFrames) r.object?.scale?.setScalar(0.5);
        }
    }
}
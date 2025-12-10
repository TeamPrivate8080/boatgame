import * as THREE from 'three';
import { MachineClient } from '../global.js';

export function CreateBulletSplash(position) {
    const splash = {
        meshes: [],
        timer: 0,
        duration: 1.0,
        position: position.clone(),
    };

    for (let i = 0; i < 40; i++) {
        const size = 0.05 + Math.random() * 0.05;
        const geo = new THREE.SphereGeometry(size, 6, 6);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x66ccff,
            transparent: true,
            opacity: 0.6 + Math.random() * 0.2,
            emissive: 0x66ccff,
            roughness: 0.3,
            metalness: 0.05,
        });

        const mesh = new THREE.Mesh(geo, mat);

        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 1.0;
        mesh.position.set(
            position.x + Math.cos(angle) * radius,
            position.y + 0.5,
            position.z + Math.sin(angle) * radius
        );

        const speed = 1.0 + Math.random() * 1.0; 
        const verticalBoost = 0.8 + Math.random() * 1.0; 
        mesh.userData.velocity = new THREE.Vector3(
            Math.cos(angle) * speed,
            verticalBoost,
            Math.sin(angle) * speed
        );

        mesh.userData.lifetime = 0.6 + Math.random() * 0.4;

        MachineClient.GlobalDefineWorld.add(mesh);
        splash.meshes.push(mesh);
    }

    MachineClient.ActiveSplashes.push(splash);
}

export function UpdateBulletSplash(deltaTime) {
    for (let i = MachineClient.ActiveSplashes.length - 1; i >= 0; i--) {
        const splash = MachineClient.ActiveSplashes[i];
        splash.timer += deltaTime;

        for (const mesh of splash.meshes) {
            mesh.position.add(mesh.userData.velocity.clone().multiplyScalar(deltaTime));
            mesh.userData.velocity.y -= 9.81 * deltaTime;

            mesh.material.opacity = THREE.MathUtils.lerp(1, 0, splash.timer / mesh.userData.lifetime);
        }

        if (splash.timer >= splash.duration) {
            for (const mesh of splash.meshes) {
                if (mesh.parent) mesh.parent.remove(mesh);
                mesh.geometry.dispose();
                mesh.material.dispose();
            }
            MachineClient.ActiveSplashes.splice(i, 1);
        }
    }
}
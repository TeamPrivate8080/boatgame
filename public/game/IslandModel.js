import { MachineClient } from "./global.js";
import { ModelCache } from './Loaders/preloader.js';
import * as THREE from 'three';

export function SpawnIsland(Name, PosObj) {
    MachineClient.ClientIslands.push({
        name: Name,
        position: PosObj
    });

    if (ModelCache['island']) {
        const clone = ModelCache['island'].clone();
        const CScale = 85;
        clone.scale.set(CScale, CScale, CScale);
        clone.position.set(PosObj.x, PosObj.y, PosObj.z);

        clone.traverse(child => {
                    child.castShadow = true;
        child.receiveShadow = true;

            if (child.isMesh && child.material) {
                child.geometry.computeVertexNormals();
                child.material.flatShading = false;

                if (child.name === "Plane") {
                    const geometry = child.geometry;
                    const position = geometry.attributes.position;
                    const colors = [];

                    const sandThresholdY = 0; // everything above this is light sand, below is dark

                    for (let i = 0; i < position.count; i++) {
                        const y = position.getY(i);

                        let color;
                        if (y > sandThresholdY) {
                            color = new THREE.Color(0xD6C694); // light sand
                        } else {
                            color = new THREE.Color(0x9F856F); // dark sand
                        }

                        colors.push(color.r, color.g, color.b);
                    }

                    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

                    child.material = new THREE.MeshStandardMaterial({
                        vertexColors: true,
                        metalness: 0,
                        roughness: 1
                    });

                } else {
                    // brighten other meshes
                    const brightenMaterial = (mat) => {
                        const newMat = mat.clone();
                        if (newMat.color) {
                            newMat.color = newMat.color.clone();
                            newMat.color.offsetHSL(0, 0, 0.5);
                        }
                        newMat.metalness = 0;
                        newMat.roughness = 1;
                        newMat.specular = new THREE.Color(0, 0, 0);
                        newMat.envMap = null;
                        newMat.emissive = new THREE.Color(0, 0, 0);
                        newMat.emissiveIntensity = 0;
                        newMat.map = mat.map;
                        newMat.transparent = true;
                        newMat.opacity = mat.opacity ?? 1;
                        return newMat;
                    };

                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(brightenMaterial);
                    } else {
                        child.material = brightenMaterial(child.material);
                    }
                }
            }
        });

        MachineClient.GlobalDefineWorld.add(clone);

        const dockRadius = 70;
        const dockSegments = 64;
        const dockGeometry = new THREE.CircleGeometry(dockRadius, dockSegments);
        const dockMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x66ccff),
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });

        const dock = new THREE.Mesh(dockGeometry, dockMaterial);
        dock.rotation.x = -Math.PI / 2;
        dock.position.y = -1.7;
        dock.position.z = PosObj.z;
        dock.position.x = PosObj.x;
        dock.renderOrder = 3;
        MachineClient.GlobalDefineWorld.add(dock);

        const outlineGeometry = new THREE.RingGeometry(dockRadius * 0.97, dockRadius, 128);
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: 'white',
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        outline.rotation.x = -Math.PI / 2;

        outline.position.x = dock.position.x;
        outline.position.y = dock.position.y + 0.1;
        outline.position.z = dock.position.z;
        outline.renderOrder = 4;
        MachineClient.GlobalDefineWorld.add(outline);

        const ScaleFac = 4;
        const canvasWidth = 256 * ScaleFac;
        const canvasHeight = 64 * ScaleFac;

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext('2d');

        ctx.font = `600 ${32 * ScaleFac}px 'Montserrat', sans-serif`;

        ctx.fillStyle = "#1FD6D1";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(Name, canvasWidth / 2, canvasHeight / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 16;
        texture.needsUpdate = true;

        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: true,
            depthWrite: false,
            fog: true
        }));

        sprite.scale.set(50, 12, 1);

        sprite.position.set(clone.position.x, clone.position.y + 50, clone.position.z);

        MachineClient.GlobalDefineWorld.add(sprite);

    }
}
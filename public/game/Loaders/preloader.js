import { OBJLoader } from '../build/OBJLoader.js';
import { MTLLoader } from '../build/MTLLoader.js';
import { MachineClient } from '../global.js';
import * as THREE from 'three';

export const ModelCache = {};

function LoadModels() {
    const models = [
        { name: 'egg', obj: './assets/Game3D/egg.obj', mtl: './assets/Game3D/egg.mtl', passrealcolors: false },
        { name: 'gun', obj: './assets/Game3D/gun.obj', mtl: './assets/Game3D/gun.mtl', passrealcolors: false },
        { name: 'island', obj: './assets/Game3D/island.obj', mtl: './assets/Game3D/island.mtl', passrealcolors: false },
        { name: 'backpack', obj: './assets/Game3D/Backpack.obj', mtl: './assets/Game3D/Backpack.mtl', passrealcolors: false },
        { name: 'rod', obj: './assets/Game3D/rod.obj', mtl: './assets/Game3D/rod.mtl', passrealcolors: false },
        { name: 'LargeRaft', obj: './assets/Game3D/LargeRaft.obj', mtl: './assets/Game3D/LargeRaft.mtl', passrealcolors: true },
        { name: 'ExplorerRaft', obj: './assets/Game3D/ExplorerRaft.obj', mtl: './assets/Game3D/ExplorerRaft.mtl', passrealcolors: true },
        { name: 'Fish1', obj: './assets/Game3D/fish.obj', mtl: './assets/Game3D/fish.mtl', passrealcolors: true },
        { name: 'shark', obj: './assets/Game3D/shark2.obj', mtl: './assets/Game3D/shark2.mtl', passrealcolors: true },
        { name: 'cannon', obj: './assets/Game3D/cannon.obj', mtl: './assets/Game3D/cannon.mtl', passrealcolors: true },
        { name: 'pump', obj: './assets/Game3D/pump.obj', mtl: './assets/Game3D/pump.mtl', passrealcolors: false },

        { name: 'raft1', obj: './assets/Game3D/StarterRaft.obj', mtl: './assets/Game3D/StarterRaft.mtl', passrealcolors: false },
        { name: 'raft2', obj: './assets/Game3D/StarterRaft.obj', mtl: './assets/Game3D/StarterRaft.mtl', passrealcolors: false },
        { name: 'raft3', obj: './assets/Game3D/StarterRaft.obj', mtl: './assets/Game3D/StarterRaft.mtl', passrealcolors: false },
        { name: 'Boat1', obj: './assets/Game3D/boat1.obj', mtl: './assets/Game3D/boat1.mtl', passrealcolors: false },
        { name: 'Boat2', obj: './assets/Game3D/boat1.obj', mtl: './assets/Game3D/boat1.mtl', passrealcolors: false },
        { name: 'Boat3', obj: './assets/Game3D/boat1.obj', mtl: './assets/Game3D/boat1.mtl', passrealcolors: false },
    ];

    models.forEach(model => {
        const mtlLoader = new MTLLoader();
        mtlLoader.load(model.mtl, (materials) => {
            materials.preload();

            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);

            objLoader.load(model.obj, (obj) => {


                const isBoat = model.name.toLowerCase().includes("boat"); 

                obj.traverse(child => {
                    if (!child.isMesh) return;

                    child.castShadow = true;    // this mesh will cast shadows
                    child.receiveShadow = true; // this mesh can receive shadows

                    const meshName = (child.name || "").toLowerCase();
                    const materials = Array.isArray(child.material) ? child.material : [child.material];

                    let isSail = meshName.includes("sail");
                    materials.forEach(mat => {
                        const matName = (mat.name || "").toLowerCase();
                        if (matName.includes("sail")) isSail = true;
                    });

                    const isPlane = meshName === "plane" || meshName.includes("plane");

                    materials.forEach((mat, i) => {
                        if (mat.isShaderMaterial) return;

                        if (isSail) {
                            mat.transparent = true;
                            mat.opacity = 0.5;
                            mat.depthWrite = false;
                            mat.alphaTest = 0.01;
                            mat.side = THREE.DoubleSide;
                            mat.fog = true;
                            if ("metalness" in mat) mat.metalness = 0;
                            if ("roughness" in mat) mat.roughness = 1;
                            mat.envMap = null;
                        }
                        else if (isPlane) {
                            mat.side = THREE.DoubleSide;
                            mat.depthWrite = true;
                            mat.transparent = false;
                        }
                        else {
                            const color = mat.color ? mat.color.clone() : new THREE.Color(0xffffff);

                            materials[i] = new THREE.MeshStandardMaterial({
                                color,
                                side: isBoat ? THREE.DoubleSide : THREE.FrontSide,  // ← FIXED HERE
                                fog: true,
                                metalness: 0,
                                roughness: 1,
                                envMap: null
                            });
                        }

                        materials[i].needsUpdate = true;
                    });

                    child.material = Array.isArray(child.material) ? materials : materials[0];
                    child.renderOrder = isSail ? 5 : 0;
                });

                obj.scale.set(1, 1, 1);
                ModelCache[model.name] = obj;
            });

        });
    });
}

LoadModels();

// clientside vertice calculator for server use (console log) | works for island & any object
const RunMatrixV2 = false;
const IsIsland = false; // f 85
const vertexStep = 1; // keep every Nth vertex for non-island, non-Plane meshes

if (RunMatrixV2) {
    setTimeout(() => {
        const fleet = ModelCache['island'].clone();
        const posX = 0;
        const posZ = 0;

        const debugLines = createVertexLines(fleet, 85, -1, posX, posZ);
        MachineClient.GlobalDefineWorld.add(debugLines);
    }, 2000);

    function createVertexLines(obj, modelScale, yOffset = 0, posX = 0, posZ = 0) {
        const group = new THREE.Group();
        const allVertices = [];

        obj.traverse(child => {
            if (!child.isMesh) return;

            const geom = child.geometry.clone();
            const combinedScale = child.scale.clone().multiplyScalar(modelScale);
            geom.scale(combinedScale.x, combinedScale.y, combinedScale.z);
            const posAttr = geom.attributes.position;

            const keepFull = child.name === "Plane" || child === obj;

            // Collect vertices (apply step if IsIsland)
            const keptVertices = [];
            const step = IsIsland && !keepFull ? vertexStep : 1;

            for (let i = 0; i < posAttr.count; i += step) {
                const vertex = new THREE.Vector3().fromBufferAttribute(posAttr, i);
                vertex.applyEuler(child.rotation);
                vertex.add(child.position);
                vertex.y += yOffset;
                vertex.x += posX;
                vertex.z += posZ;

                allVertices.push([
                    Number(vertex.x.toFixed(3)),
                    Number(vertex.y.toFixed(3)),
                    Number(vertex.z.toFixed(3))
                ]);

                keptVertices.push(vertex);
            }

            if (keptVertices.length > 1) {
                const lineGeom = new THREE.BufferGeometry();
                const points = [];
                for (let i = 0; i < keptVertices.length - 1; i++) {
                    points.push(keptVertices[i], keptVertices[i + 1]);
                }
                lineGeom.setFromPoints(points);

                const mat = new THREE.LineBasicMaterial({ color: 0xff0000 });
                const lines = new THREE.LineSegments(lineGeom, mat);
                group.add(lines);
            }
        });

        console.log('Vertices JSON:', JSON.stringify(allVertices));
        console.log('Total vertices:', allVertices.length);

        return group;
    }
}
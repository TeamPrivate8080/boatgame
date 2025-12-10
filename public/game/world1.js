import * as THREE from 'three';
import { MachineClient } from "./global.js";
import { Water } from './build/Water.js';

export let NewWater = null;

export let water, mesh, waterGeometry

export function SetupWorld1() {

    const BorderRadius = 1000;
    const BorderWidth = 3
    const geometry = new THREE.RingGeometry(BorderRadius - BorderWidth, BorderRadius, 512);

    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshBasicMaterial({
        color: 'white',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
    });

    const border = new THREE.Mesh(geometry, material);
    border.position.set(0, -1, 0);
    border.renderOrder = 4;
    MachineClient.GlobalDefineWorld.add(border);


    // Water

    waterGeometry = new THREE.PlaneGeometry(3000, 3000);

    water = new Water(
        waterGeometry,
        {
            textureWidth: 256,
            textureHeight: 256,
            waterNormals: new THREE.TextureLoader().load('./assets/shaders/waternormals.jpg', function (texture) {

                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

            }),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: '#87cefa',
            distortionScale: 4,
            fog: MachineClient.GlobalDefineWorld.fog !== undefined
        }
    );

    water.rotation.x = - Math.PI / 2;
    water.position.y = -2

    MachineClient.GlobalDefineWorld.add(water);

    const waterUniforms = water.material.uniforms;

    waterUniforms['size'].value = 2


    /*

        const geometry2 = new THREE.BoxGeometry(2500, 0.9, 2500);
    
        const textureLoader = new THREE.TextureLoader();
        const waterTexture = textureLoader.load('./assets/shaders/water.png');
    
        waterTexture.wrapS = THREE.RepeatWrapping;
        waterTexture.wrapT = THREE.RepeatWrapping;
        waterTexture.repeat.set(20, 20); // adjust how many times it repeats
    
    NewWater = new THREE.Mesh(
        geometry2,
        new THREE.MeshStandardMaterial({
            map: waterTexture,
            color: new THREE.Color(0x99ccff),
            roughness: 1,
            metalness: 0.1,
            opacity: 0.9,
            transparent: true,
            depthWrite: true,
            depthTest: true
        })
    );
    
    NewWater.position.y = -2.5;
    NewWater.renderOrder = 0; // render before islands
    MachineClient.GlobalDefineWorld.add(NewWater);
    
    */

    const radius = 380;
    const height = 150;
    const cylGeo = new THREE.CylinderGeometry(radius, radius, height, 64, 1, false);

    const cylMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {
            topColor: { value: new THREE.Color(0xBBE8FF) },     // light blue sky
            middleColor: { value: new THREE.Color(0xCCEEFF) },  // soft fog in middle
            bottomColor: { value: new THREE.Color(0xffffff) },  // dense fog at bottom
            height: { value: height }
        },
        vertexShader: `
                varying float vY;
                void main() {
                    vY = position.y;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                }
            `,
        fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 middleColor;
                uniform vec3 bottomColor;
                uniform float height;
                varying float vY;
        
                void main() {
                    float f = (vY + height/2.0) / height; // 0 at bottom, 1 at top
        
                    // smoothstep parameters control where transitions occur
                    float bottomToMiddle = smoothstep(0.0, 0.99, f);
                    float middleToTop = smoothstep(0.33, 2.0, f);
        
                    vec3 color = mix(bottomColor, middleColor, bottomToMiddle);
                    color = mix(color, topColor, middleToTop);
        
                    gl_FragColor = vec4(color, 1.0);
                }
            `
    });


    // Mesh
    const boundary = new THREE.Mesh(cylGeo, cylMat);
    boundary.position.y = height / 2 - 2.6; // align with water
    MachineClient.GlobalDefineWorld.add(boundary);

    MachineClient.FogBoundary = boundary;
    boundary.renderOrder = 5;

    let warmAmbientlight;
    let coldAmbientlight;
    let light;

    // Warm ambient light
    warmAmbientlight = new THREE.AmbientLight(0xffd2ad, 1);
    MachineClient.GlobalDefineWorld.add(warmAmbientlight);

    // Cold ambient light
    coldAmbientlight = new THREE.AmbientLight(0xd4e4ff, 0.6);
    MachineClient.GlobalDefineWorld.add(coldAmbientlight);

    // Directional light
    light = new THREE.DirectionalLight(0xffdfab, 1.2);
    light.position.set(0, 10, 20);
    MachineClient.GlobalDefineWorld.add(light);

    MachineClient.GlobalDefineWorld.fog = new THREE.Fog(0xffffff, 50, 400);

    const cloudLayer = new THREE.Group();
    const cloudMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
        depthTest: true,
        roughness: 1,
        metalness: 0
    });

    const cloudCount = 150; // cloud groups

    for (let i = 0; i < cloudCount; i++) {
        const blockCount = 2 + Math.floor(Math.random() * 10);

        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const cloud = new THREE.InstancedMesh(boxGeo, cloudMaterial, blockCount);

        const dummy = new THREE.Object3D(); // transforms

        for (let j = 0; j < blockCount; j++) {
            const w = 20 + Math.random() * 40;
            const h = 5 + Math.random() * 10;
            const d = 20 + Math.random() * 40;

            dummy.position.set(
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 60
            );
            dummy.scale.set(w, h, d);
            dummy.updateMatrix();

            cloud.setMatrixAt(j, dummy.matrix);
        }


        const scale = 0.8 + Math.random() * 0.4;
        cloud.scale.set(scale, scale, scale);

        cloud.position.set(
            (Math.random() - 0.5) * 2000,
            90,
            (Math.random() - 0.5) * 2000
        );

        cloudLayer.add(cloud);
    }

    MachineClient.GlobalDefineWorld.add(cloudLayer);
    MachineClient.CloudLayer = cloudLayer;


}
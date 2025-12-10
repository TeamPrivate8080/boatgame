import * as THREE from 'three';
import { MachineClient } from '../global.js';

const tex = new THREE.TextureLoader().load('/assets/Game3D/crate.png');

MachineClient.ClientNetPeer.on('crates', (Crates) => {
    if (!Crates || Crates.length === 0) return;

    Crates.forEach(crate => addCrateToScene(crate));
});

MachineClient.ClientNetPeer.on('new_crate', (crate) => {
    addCrateToScene(crate);
});

MachineClient.ClientNetPeer.on('collect_crate', ({ CrateID, FleetID }) => {
    const crateMesh = MachineClient.ClientStoredCrates[String(CrateID)];
    if (crateMesh) {
        MachineClient.GlobalDefineWorld.remove(crateMesh);
        crateMesh.geometry.dispose();
        if (crateMesh.material.map) crateMesh.material.map.dispose();
        crateMesh.material.dispose();
        delete MachineClient.ClientStoredCrates[String(CrateID)];
    }
});


function addCrateToScene(crate) {
    if (!crate || crate.x === undefined || crate.y === undefined || crate.z === undefined) {
        return;
    }

    const mat = tex
        ? new THREE.MeshStandardMaterial({
              map: tex,
              roughness: 1,
              metalness: 0.0,
              color: 0xDEB887
          })
        : null;

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), mat);
    mesh.position.set(crate.x, crate.y + 1, crate.z);
    mesh.rotation.y = crate.ry || 0;

    MachineClient.GlobalDefineWorld.add(mesh);
    MachineClient.ClientStoredCrates[crate.id] = mesh;
}

export function Cleanup_Crates() {
    const crates = MachineClient.ClientStoredCrates;

    for (const id in crates) {
        const crate = crates[id];
        if (!crate) continue;

        MachineClient.GlobalDefineWorld.remove(crate);

        if (crate.geometry) crate.geometry.dispose();
        if (crate.material) {
            if (Array.isArray(crate.material)) {
                crate.material.forEach(m => {
                    if (m.map) m.map.dispose();
                    m.dispose();
                });
            } else {
                if (crate.material.map) crate.material.map.dispose();
                crate.material.dispose();
            }
        }

        delete crates[id];
    }

}
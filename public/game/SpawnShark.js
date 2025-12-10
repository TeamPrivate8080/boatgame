import * as THREE from 'three';
import { MachineClient } from "./global.js";
import { ModelCache } from './Loaders/preloader.js';

export function SpawnShark(payload) {
    const { ObjectID, ObjectData } = payload;

    if (MachineClient.ClientStoredSharks[ObjectID]) return;

    const SharkRoot = new THREE.Group();
    SharkRoot.position.set(ObjectData.position.x, ObjectData.position.y, ObjectData.position.z);
    MachineClient.GlobalDefineWorld.add(SharkRoot);

    const targetPos = new THREE.Vector3(ObjectData.position.x, ObjectData.position.y, ObjectData.position.z);
    MachineClient.ClientStoredSharks[ObjectID] = {
        obj: SharkRoot,
        targetPos,
        direction: ObjectData.direction
    };

    if (ModelCache['shark']) {
        const model = ModelCache['shark'].clone();
        model.scale.set(1.1, 1.1, 1.1);
        SharkRoot.add(model);
    } else {
        console.warn('shark model not yet loaded');
    }

}

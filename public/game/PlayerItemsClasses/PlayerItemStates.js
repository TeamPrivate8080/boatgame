import { MachineClient } from '../global.js';
import { ModelCache } from '../Loaders/preloader.js';

export function EquipGun(playerId) {
    const FoundStoredPlayer = MachineClient.ClientStoredPlayers[playerId];
    if (!FoundStoredPlayer) return;

    if (FoundStoredPlayer.gunObj) return;

    if (!ModelCache['gun']) {
        console.warn('Item gun not loaded');
        return;
    }

    const weaponscale = 0.3;
    const gun = ModelCache['gun'].clone();
    gun.position.set(0.69, 0.2, -0.2);
    gun.scale.set(weaponscale, weaponscale, weaponscale);

    FoundStoredPlayer.obj.add(gun);
    FoundStoredPlayer.gunObj = gun;
}

export function DeleteGun(playerId) {
    const FoundStoredPlayer = MachineClient.ClientStoredPlayers[playerId];
    if (!FoundStoredPlayer) return;

    if (FoundStoredPlayer.gunObj) {
        FoundStoredPlayer.obj.remove(FoundStoredPlayer.gunObj);
        FoundStoredPlayer.gunObj = null;
    } else {
        const gunChild = FoundStoredPlayer.obj.children.find(c => c.name === 'gun');
        if (gunChild) FoundStoredPlayer.obj.remove(gunChild);
    }
}

export function EquipRod(playerId) {
    const FoundStoredPlayer = MachineClient.ClientStoredPlayers[playerId];
    if (!FoundStoredPlayer) return;

    if (FoundStoredPlayer.rodObj) return;

    if (!ModelCache['rod']) {
        console.warn('Item fishingrod not loaded');
        return;
    }

    const rod = ModelCache['rod'].clone();
    rod.name = 'rod';

    const rodScale = 0.45;
    rod.position.set(0.66, 0, -0.5);
    rod.rotation.set(0, 0, 0);
    rod.scale.set(rodScale, rodScale, rodScale);

    FoundStoredPlayer.obj.add(rod);

    FoundStoredPlayer.rodObj = rod;
}

export function DeleteRod(playerId) {
    const FoundStoredPlayer = MachineClient.ClientStoredPlayers[playerId];
    if (!FoundStoredPlayer) return;

    if (FoundStoredPlayer.rodObj) {
        FoundStoredPlayer.obj.remove(FoundStoredPlayer.rodObj);
        FoundStoredPlayer.rodObj = null;
    } else {
        const rodChild = FoundStoredPlayer.obj.children.find(c => c.name === 'rod');
        if (rodChild) FoundStoredPlayer.obj.remove(rodChild);
    }
}

export function EquipCannon(playerId) {
    const FoundStoredPlayer = MachineClient.ClientStoredPlayers[playerId];
    if (!FoundStoredPlayer) return;

    if (FoundStoredPlayer.CannonObj) return;

    if (!ModelCache['cannon']) {
        console.warn('Item cannon not loaded');
        return;
    }

    const weaponscale = 0.3;
    const gun = ModelCache['cannon'].clone();
    gun.position.set(0, 0.2, -0.3);
    gun.scale.set(weaponscale, weaponscale, weaponscale);

    FoundStoredPlayer.obj.add(gun);
    FoundStoredPlayer.CannonObj = gun;
}

export function DeleteCannon(playerId) {
    const FoundStoredPlayer = MachineClient.ClientStoredPlayers[playerId];
    if (!FoundStoredPlayer) return;

    if (FoundStoredPlayer.CannonObj) {
        FoundStoredPlayer.obj.remove(FoundStoredPlayer.CannonObj);
        FoundStoredPlayer.CannonObj = null;
    } else {
        const gunChild = FoundStoredPlayer.obj.children.find(c => c.name === 'cannon');
        if (gunChild) FoundStoredPlayer.obj.remove(gunChild);
    }
}
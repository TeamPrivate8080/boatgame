import { MachineClient } from "./global.js";
import { ChatFocus } from "./UIClasses/ChatModel.js";

const movementKeys = {
    'KeyW': 'forward',
    'KeyS': 'backward',
    'KeyA': 'left',
    'KeyD': 'right',
    'ArrowUp': 'forward',
    'ArrowDown': 'backward',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'Space': 'jump'
};

const KeyMemCaching = {};

window.addEventListener('keydown', e => {
    const EventKeyString = movementKeys[e.code];
    if (document.pointerLockElement !== document.body) return;
    if (!EventKeyString || ChatFocus) return;
    if (!KeyMemCaching[e.code]) {
        KeyMemCaching[e.code] = true;
        MachineClient.ClientNetPeer.emit('key', { k: EventKeyString, d: true });
    }
});

window.addEventListener('keyup', e => {
    const EventKeyString = movementKeys[e.code];
    if (document.pointerLockElement !== document.body) return;
    if (!EventKeyString || ChatFocus) return;
    KeyMemCaching[e.code] = false;
    MachineClient.ClientNetPeer.emit('key', { k: EventKeyString, d: false });
});
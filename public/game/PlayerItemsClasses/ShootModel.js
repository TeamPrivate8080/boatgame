import { MachineClient } from "../global.js";
import { PumpPreview, PumpEquipped } from "./PumpPlacement.js";

export const SetupShootModel = () => {
    let isShooting = false;

    const SingleHit = () => {
        const { ClientStoredPlayers, ClientStoredClientID, ClientNetPeer } = MachineClient;
        const MyPlayer = ClientStoredPlayers[ClientStoredClientID];
        if (!ClientNetPeer?.connected || !MyPlayer) return;

        if(PumpEquipped) {
            ClientNetPeer.emit('use_item', { Item: 'pump', 
            Payload: {
                position: PumpPreview.position,
                rotation: PumpPreview.rotation
            }
            })
        }

        let item = null;
        if (MyPlayer?.gunObj) item = 'gun1';
        else if (MyPlayer?.CannonObj) item = 'cannon';
        else if (MyPlayer?.rodObj) item = 'rod';

        if (!item) return;

        ClientNetPeer.emit('use_item', { Item: item });
    };

    const sendHoldState = (holding) => {
        const { ClientStoredPlayers, ClientStoredClientID, ClientNetPeer } = MachineClient;
        const MyPlayer = ClientStoredPlayers[ClientStoredClientID];
        if (!ClientNetPeer?.connected || !MyPlayer) return;

        let item = null;
        if (MyPlayer?.gunObj) item = 'gun1';
        else if (MyPlayer?.CannonObj) item = 'cannon';
        else if (MyPlayer?.rodObj) item = 'rod';

        if (!item) return;

        ClientNetPeer.emit('h_mouse', holding);
    };

    const StartShooting = () => {
        if (MachineClient.ClientMenu) return;
        if (document.pointerLockElement !== document.body) return;

        SingleHit();

        if (!isShooting) {
            isShooting = true;
            sendHoldState(true);
        }
    };

    const StopShooting = () => {
        if (isShooting) {
            isShooting = false;
            sendHoldState(false);
        }
    };

    // listeners
    document.addEventListener('mousedown', StartShooting);
    document.addEventListener('mouseup', StopShooting);
    document.addEventListener('mouseleave', StopShooting);
};
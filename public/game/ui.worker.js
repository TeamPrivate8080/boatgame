import { MachineClient } from "./global.js";

window.addEventListener('load', () => {
    setTimeout(() => {
        const content = document.querySelector('.content-wrapper');
        content.classList.remove('hidden');
        
        const loader = document.querySelector('.content-loader')
        loader.classList.add('hidden');

        if (MachineClient.ClientNetPeer && !MachineClient.ClientNetPeer.connected) {
            MachineClient.ClientNetPeer.connect();
        }
    }, 800);
});
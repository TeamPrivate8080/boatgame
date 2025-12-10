import { MachineClient } from "../global.js";

const AlertBox = document.getElementById('classic-alert');
let AlertTimeout = null;

function SAlert(message) {
    document.getElementById('classic-alert-text').textContent = message;

    AlertBox.classList.remove('hidden');

    if (AlertTimeout) clearTimeout(AlertTimeout);

    AlertTimeout = setTimeout(() => {
        AlertBox.classList.add('hidden');
        AlertTimeout = null;
    }, 5000);
}

document.getElementById('classic-alert-close').addEventListener('click', () => {
    AlertBox.classList.add('hidden');
    if (AlertTimeout) {
        clearTimeout(AlertTimeout);
        AlertTimeout = null;
    }
});

MachineClient.ClientNetPeer.on('rt_alert', (p) => {
    SAlert(p);
});
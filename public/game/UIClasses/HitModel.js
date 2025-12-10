import { MachineClient } from "../global.js";
import { PlaySound } from '../audio/audio_player.js';

function TBloodEFF() {
    let blood = document.getElementById('blood-effect');
    if (!blood) {
        blood = document.createElement('div');
        blood.id = 'blood-effect';
        blood.style.position = 'fixed';
        blood.style.top = '0';
        blood.style.left = '0';
        blood.style.width = '100%';
        blood.style.height = '100%';
        blood.style.background = 'radial-gradient(rgba(255,0,0,0.3), rgba(100,0,0,0.8))';
        blood.style.opacity = '0';
        blood.style.transition = 'opacity 0.7s ease-out';
        blood.style.pointerEvents = 'none';
        blood.style.zIndex = '9998';
        document.body.appendChild(blood);
    }

    blood.style.opacity = '1';
    setTimeout(() => {
        blood.style.opacity = '0';
    }, 100);
}

function NetDispHitmarkerDMG(fleetid, damage, neg) {
    const hit = document.createElement('div');
    hit.className = 'hitmarker';

    hit.style.fontFamily = "'Orbitron', 'Arial Black', sans-serif";
    hit.style.fontSize = '34px';
    hit.style.fontWeight = '900';
    hit.style.letterSpacing = '1px';
    hit.style.position = 'fixed';
    hit.style.top = '35%';
    hit.style.left = `calc(50% + ${Math.random() * 40 - 20}px)`;
    hit.style.transform = 'translate(-50%, -50%) scale(0.8)';
    hit.style.pointerEvents = 'none';
    hit.style.zIndex = '9999';
    hit.style.opacity = '1';
    hit.style.textAlign = 'center';
    hit.style.textShadow = `
        0 0 6px black,
        0 0 10px black,
        0 0 4px rgba(0,0,0,0.5)
    `;
    hit.style.transition = `
        transform 0.8s cubic-bezier(0.3, 0, 0.3, 1),
        opacity 0.8s ease-out,
        filter 0.3s ease
    `;

    if (neg) {
        hit.innerHTML = `<span style="font-size:24px;">Damage Dealt</span><br>+${damage}`;
        hit.style.color = '#7efc007c';
        hit.style.filter = 'drop-shadow(0 0 6px #00ff007a)';
        PlaySound('hit', 0.5);
    } else {
        hit.innerHTML = `<span style="font-size:24px;">Damage Taken</span><br>-${damage}`;
        hit.style.color = '#FF3333';
        hit.style.filter = 'drop-shadow(0 0 6px #FF0000)';
        TBloodEFF();
        PlaySound('hitwood', 0.5);
    }

    document.body.appendChild(hit);

    setTimeout(() => {
        hit.style.transform = 'translate(-50%, -120%) scale(1.3)';
        hit.style.opacity = '0';
        hit.style.filter = 'blur(1px) brightness(1.3)';
    }, 25);

    setTimeout(() => hit.remove(), 900);
}

MachineClient.ClientNetPeer.on('net.marker.dmg', (a) => {
    const { fleetid, damage, neg } = a;
    NetDispHitmarkerDMG(fleetid, damage, neg);
});

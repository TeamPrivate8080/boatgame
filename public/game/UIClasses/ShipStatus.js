import { MachineClient } from '../global.js';

MachineClient.ClientNetPeer.on('ShipPackageStatus', (o) => {
    const { img, health, maxhealth, crew, maxcrew, cargo, maxcargo, shipclass, shipname } = o;

    const imgasset = './assets/icons/ships/' + img + '.png';

    const Modal_Img = document.getElementById('ship-image');
    const Modal_Hp = document.getElementById('ship-health-text');
    const Modal_Crew = document.getElementById('ship-crew-text');
    const Modal_Cargo = document.getElementById('ship-cargo-text');
    const Modal_Class = document.getElementById('ship-class');
    const Modal_Name = document.getElementById('ship-name');

    if (Modal_Img) Modal_Img.src = imgasset;
    if (Modal_Hp) Modal_Hp.textContent = `${health}/${maxhealth}`;
    if (Modal_Crew) Modal_Crew.textContent = `${crew}/${maxcrew}`;
    if (Modal_Cargo) Modal_Cargo.textContent = `${cargo}/${maxcargo} Kg`;
    if (Modal_Class) Modal_Class.textContent = `Class: ${shipclass || 'Unknown'}`;
    if (Modal_Name) Modal_Name.textContent = shipname || 'Ship Name';

    const InvButton = document.getElementById('invite-button');
    const DepartBtn = document.getElementById('depart-button');

    if (InvButton) {
        InvButton.addEventListener('click', () => {
            const protocol = window.location.protocol;
            const UrlPayload = `${protocol}//${window.location.host}/?invite=${MachineClient.ClientStoredInviteID || 'unknown'}`;

            const input = document.createElement('input');
            input.type = 'text';
            input.value = UrlPayload;
            input.readOnly = true;
            input.className = 'bg-gray-800 text-white text-xs font-semibold py-1 px-2 rounded shadow-md text-center';
            input.style.width = `${InvButton.offsetWidth}px`;

            InvButton.replaceWith(input);
            input.select();

            input.addEventListener('click', () => {
                input.replaceWith(InvButton);
            });
        });
    }

    if (DepartBtn) {
        DepartBtn.onclick = () => {
            MachineClient.ClientNetPeer.emit('depart');
        };
    }
});
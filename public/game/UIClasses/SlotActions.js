import { MachineClient } from '../global.js';
import { ChatFocus } from "../UIClasses/ChatModel.js";

window.addEventListener('keydown', e => {
    if(ChatFocus) return;
    if (e.code.startsWith('Digit')) {
        const slot = parseInt(e.code.replace('Digit', ''));
        if (slot >= 1 && slot <= 5) {
            MachineClient.ClientNetPeer.emit('CSlot', slot);
        }
    }

    if (e.code.startsWith('Numpad')) {
        const slot = parseInt(e.code.replace('Numpad', ''));
        if (slot >= 1 && slot <= 5) {
            MachineClient.ClientNetPeer.emit('CSlot', slot);
        }
    }
});

export function AddInvSlot(slot, imgSrc) {
  const hotbar = document.querySelector('.hotbar');
  const SlotIndex = slot - 1;
  const SlotDiv = hotbar.querySelectorAll('.slot')[SlotIndex];
  if (!SlotDiv) return;

  const box = SlotDiv.querySelector('.box');
  if (!box) return;

  box.querySelectorAll('img').forEach(img => img.remove());

  const img = document.createElement('img');
  img.src = imgSrc;
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.borderRadius = '5px';
  img.style.pointerEvents = 'none';
  img.style.objectFit = 'cover';

  box.appendChild(img);
}


export function SetInvActiveSlot(slot) {
    const hotbar = document.querySelector('.hotbar');
    const boxes = hotbar.querySelectorAll('.box');

    boxes.forEach((box, index) => {
        if (index === slot - 1) {
            box.classList.add('active');
        } else {
            box.classList.remove('active');
        }
    });
}

MachineClient.ClientNetPeer.on('RemoveSlot', (slot) => {
        const hotbar = document.querySelector('.hotbar');
    const SlotIndex = slot - 1;

    const SlotDiv = hotbar.querySelectorAll('.slot')[SlotIndex];
    if (!SlotDiv) return;

    const box = SlotDiv.querySelector('.box');
    if (!box) return;

    // Remove all images in this slot
    box.querySelectorAll('img').forEach(img => img.remove());
})
import { MachineClient } from '../global.js';

const amountSlider = document.getElementById('offerAmount');
const priceSlider = document.getElementById('OfferPrice');
const amountLabel = document.getElementById('AmountLab');
const priceLabel = document.getElementById('PriceLab');
const postBtn = document.getElementById('BtnPostOffer');
const itemSelect = document.getElementById('OfferItem');
const offersList = document.getElementById('OffersList');

amountSlider.addEventListener('input', () => amountLabel.textContent = amountSlider.value);
priceSlider.addEventListener('input', () => priceLabel.textContent = priceSlider.value);

function UpdateOffers(serverOffers) {
  offersList.innerHTML = '';
  const myID = MachineClient.ClientStoredClientID;

  serverOffers.forEach((offer) => {
    const offerDiv = document.createElement('div');
    offerDiv.className = 'flex justify-between items-center p-1 bg-cyan-900/20 border border-cyan-500/20 rounded text-xs';

    let buttonHTML = '';

    if (offer.ownerID === myID) {
      buttonHTML = `<button class="px-2 py-0.5 bg-red-500 rounded hover:bg-red-400 text-xs">Cancel</button>`;
    } else {
      buttonHTML = `<button class="px-2 py-0.5 bg-cyan-500 rounded hover:bg-cyan-400 text-xs">Buy</button>`;
    }

    offerDiv.innerHTML = `
      <span>${offer.amount}x ${offer.item} for ${offer.price} Gold <em class="text-cyan-400">(${offer.owner || 'Unknown'})</em></span>
      ${buttonHTML}
    `;

    const btn = offerDiv.querySelector('button');

    if (offer.ownerID === myID) {
      btn.addEventListener('click', () => {
        MachineClient.ClientNetPeer.emit('market_cancel', { id: offer.id });
      });
    } else {
      btn.addEventListener('click', () => {
        MachineClient.ClientNetPeer.emit('market_buy', { id: offer.id });
      });
    }

    offersList.appendChild(offerDiv);
  });
}

postBtn.addEventListener('click', () => {
  const item = itemSelect.value;
  const amount = parseInt(amountSlider.value);
  const price = parseInt(priceSlider.value);

  if (amount <= 0 || price <= 0) {
    alert('Amount and price must be greater than 0.');
    return;
  }

  MachineClient.ClientNetPeer.emit('market_post', { item, amount, price });
});

MachineClient.ClientNetPeer.on('market_offers_update', (serverOffers) => {
  UpdateOffers(serverOffers);
});
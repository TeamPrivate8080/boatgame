const { Offers } = require('../../ServerStoring');

function EmuThrowOpenOffer() {
        const OfferPayload = [
        {
            id: Math.random().toString(36).substr(2, 9),
            item: 'wood',
            amount: 100,
            price: 1500,
            owner: 'Server',
            ownerID: 'npc_trader_1'
        },
        {
            id: Math.random().toString(36).substr(2, 9),
            item: 'wood',
            amount: 100,
            price: 1500,
            owner: 'Server',
            ownerID: 'npc_trader_2'
        }
    ];

    Offers.push(...OfferPayload);
}

module.exports = {
    EmuThrowOpenOffer
}
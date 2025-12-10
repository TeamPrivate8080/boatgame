const { Players, Offers } = require('../../ServerStoring');
const { ConfigCache } = require('../../ConfigLoader');

function EmuWSHandleMarketPost(data, Engine, Peer) {
    const player = Players[Peer.id];
    if (!player) return;

    const ActiveOffers = Offers.filter(offer => offer.ownerID === Peer.id);
    if (ActiveOffers.length >= 2) {
        Peer.emit('s_err', 'You can only have 2 active offers at a time.');
        return;
    }

    if (data.item === 'wood' && player.ValueStates.wood.amount < data.amount) {
        Peer.emit("s_err", "Not enough wood to post this offer.");
        return;
    }

    if (data.item === 'wood') player.ValueStates.wood.amount -= data.amount;

    Peer.emit('UValues', {
        gold: player.ValueStates.gold.amount,
        wood: player.ValueStates.wood.amount
    });

    const NewOfferPayload = {
        id: Math.random().toString(36).substr(2, 9),
        item: data.item,
        amount: data.amount,
        price: data.price,
        owner: player.ObjectName,
        ownerID: Peer.id
    };

    Offers.push(NewOfferPayload);
    Engine.emit('market_offers_update', Offers);

    if (ConfigCache.Server.Debug) console.log(`New offer posted by ${player.ObjectName}:`);
}

function EmuWSHandleMarketBuy(data, Engine, Peer) {
    const player = Players[Peer.id];
    if (!player) return;

    const offerIndex = Offers.findIndex(o => o.id === data.id);
    if (offerIndex === -1) return;

    const offer = Offers[offerIndex];

    if (player.ValueStates.gold.amount < offer.price) {
        Peer.emit("s_err", "Not enough gold to buy this offer.");
        return;
    }

    const isNPC = !Players[offer.ownerID];

    player.ValueStates.gold.amount -= offer.price;

    if (offer.item === 'wood') player.ValueStates.wood.amount += offer.amount;

    if (!isNPC) {
        const seller = Players[offer.ownerID];
        seller.ValueStates.gold.amount += offer.price;

        Engine.to(offer.ownerID).emit('UValues', {
            gold: seller.ValueStates.gold.amount,
            wood: seller.ValueStates.wood.amount
        });
    }

    Offers.splice(offerIndex, 1);

    Engine.emit('market_offers_update', Offers);

    Peer.emit('UValues', {
        gold: player.ValueStates.gold.amount,
        wood: player.ValueStates.wood.amount
    });
}

function EmuWSHandleMarketCancel(data, Engine, Peer) {
    const player = Players[Peer.id];
    if (!player) return;

    const offerIndex = Offers.findIndex(o => o.id === data.id && o.ownerID === Peer.id);
    if (offerIndex === -1) {
        Peer.emit('s_err', "Offer not found or you don't own it.");
        return;
    }

    const offer = Offers[offerIndex];

    if (offer.item === 'wood') {
        player.ValueStates.wood.amount += offer.amount;
    }

    Offers.splice(offerIndex, 1);

    Peer.emit('UValues', {
        gold: player.ValueStates.gold.amount,
        wood: player.ValueStates.wood.amount
    });

    Engine.emit('market_offers_update', Offers);

    if (ConfigCache.Server.Debug)
        console.log(`Offer cancelled by ${player.ObjectName}:`, offer);
}

module.exports = {
    EmuWSHandleMarketPost,
    EmuWSHandleMarketBuy,
    EmuWSHandleMarketCancel
}
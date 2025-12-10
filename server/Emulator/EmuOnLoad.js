const { EmuThrowOpenOffer } = require('./EmulatorOnBootSpaces/ServerMarketOffers');
const { ServerSpawnSharks } = require('./EmulatorOnBootSpaces/ServerSpawnSharks');
const { ServerSpawnCrates } = require('./EmulatorOnBootSpaces/ServerSpawnCrates');

function EmulatorOnBoot(io) {
    EmuThrowOpenOffer();
    ServerSpawnCrates(20);
    ServerSpawnSharks(io, 3);
}

module.exports = {
    EmulatorOnBoot
}
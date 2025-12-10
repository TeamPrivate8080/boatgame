const { EmulatorUpdateGold } = require('./EmulatorActions/Emu.values');
const { EmulatorCreatePlayer } = require('./EmulatorActions/Emu.CreatePlayer');
const { EmulatorCreateShip } = require('./EmulatorActions/Emu.CreateShip');
const { EmulatorAddPlayerToShip } = require('./EmulatorActions/Emu.ShipAddPlayer');
const { EmulatorUseRod } = require('./EmulatorActions/Emu.UseRod');
const { EmulatorUseCannon } = require('./EmulatorActions/Emu.UseCannon');
const { EmulatorThrowFishReward } = require('./EmulatorActions/Emu.FishReward');
const { EmulatorSpawnShark } = require('./EmulatorActions/Emu.SpawnShark');
const { EmulatorOnBoot } = require('./EmuOnLoad')
const { EmulatorHandleMessageChatComposer } = require('./EmulatorActions/Emu.ChatComposer')
const { EmuHookMsgHandler } = require('./EmulatorWorkspace/EmuWS.HandleCommands');
const { EmuExternalTexts_GetAvailableNameTag } = require('./EmulatorWorkspace/EmuWS.HandleTexts');
const { EmuThrowOpenOffer } = require('./EmulatorOnBootSpaces/ServerMarketOffers');
const { EmuWSHandleMarketPost, EmuWSHandleMarketBuy, EmuWSHandleMarketCancel } = require('./EmulatorWorkspace/EmuWS.HandleMarketPPS');
const { EmulatorSpawnNewCrate } = require('./EmulatorActions/Emu.SpawnCrate');
const { EmulatorRequestDepartShip } = require('./EmulatorActions/Emu.DepartShip');
const { EmulatorPlaceSaltPump } = require('./EmulatorActions/Emu.PlacePump');
const { EmulatorRemovePlayersFromFleet } = require('./EmulatorActions/Emu.UnpackShip');

const Emulator = {
    EmulatorUpdateGold,
    EmulatorCreatePlayer,
    EmulatorCreateShip,
    EmulatorAddPlayerToShip,
    EmulatorUseRod,
    EmulatorUseCannon,
    EmulatorThrowFishReward,
    EmulatorSpawnShark,
    EmulatorOnBoot,
    EmulatorHandleMessageChatComposer,
    EmuHookMsgHandler,
    EmuExternalTexts_GetAvailableNameTag,
    EmuThrowOpenOffer,
    EmuWSHandleMarketPost,
    EmuWSHandleMarketBuy,
    EmuWSHandleMarketCancel,
    EmulatorSpawnNewCrate,
    EmulatorRequestDepartShip,
    EmulatorPlaceSaltPump,
    EmulatorRemovePlayersFromFleet
};

console.log(`
[Emulator Main] Emulator has loaded with ${Object.keys(Emulator).length - 2} Emulator functions.
💡 Info: Boatgame Emulator - Private Emulator powered to function actions and net-code properly.
`);

module.exports = Emulator;
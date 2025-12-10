const { Players, Offers, Crates, Pumps } = require("../../ServerStoring.js");
const { ConfigCache } = require('../../ConfigLoader.js');
const { EmulatorHandleMessageChatComposer } = require('../EmulatorActions/Emu.ChatComposer.js');
const HandlerTagName = '[net.con.handle]', HandlerCoTagName = '[func.execution]';
const { EmuExternalTexts_GetAvailableNameTag } = require('../EmulatorWorkspace/EmuWS.HandleTexts.js');

function EmulatorCreatePlayer(io, peer, ClientPayload) {
    if (!ClientPayload || typeof ClientPayload.ClassUID !== 'string') return;

    const Obj = ClientPayload;
    const Peer = peer;
    const PlayerID = Peer.id;

    Peer.OpenRoomKey = 'open_pvp';
    Peer.join(String(Peer.OpenRoomKey));

    if (ConfigCache.Server.Debug) console.log(
        HandlerTagName + HandlerCoTagName,
        'Creating Player ...'
    );



    if (ConfigCache.Server.Debug) console.log(
        HandlerTagName + HandlerCoTagName,
        'Player Object Created. Waiting for Sync or Manual Packet.'
    )

    if (Players[PlayerID]) {
        Peer.emit('market_offers_update', Offers);
        Peer.emit('crates', Crates)
        Peer.emit('PlacePumps', Pumps)

        io.emit('CreatePlayer', {
            PlayerPayload: Players[PlayerID],
        })
        Peer.emit('ExistPlayers', {
            Players: Object.values(Players)
        })
        if (Players[PlayerID].ShopVehicleStates["s1"]) {
            Peer.emit('s_o', {
                page: 1,
                item: 1
            });
        };
        if (ConfigCache.Server.Debug) console.log(
            HandlerTagName,
            'Manual Packet Done.'
        )
        Peer.emit('welcome');
        /*
        Peer.emit('inv_slot', {
            slot: 1,
            item: 'gun1'
        });
        */
        EmulatorHandleMessageChatComposer(io, Peer, {
            Message: 'Write ' + ConfigCache.Server.CommandPin + 'help to see available commands.',
            SenderName: "Server",
            GlobalMsg: false
        });
        EmulatorHandleMessageChatComposer(io, Peer, {
            Message: '[' + Players[PlayerID].ObjectGame.rank + '] ' + (Players[PlayerID].ObjectName || "Unknown") + ' joined the game.',
            SenderName: 'Server',
            GlobalMsg: true
        });
    } else {
        if (ConfigCache.Server.Debug) console.log(
            HandlerTagName + HandlerCoTagName,
            'Player Object Destroyed or Not Found'
        )
    }

}

module.exports = {
    EmulatorCreatePlayer
}
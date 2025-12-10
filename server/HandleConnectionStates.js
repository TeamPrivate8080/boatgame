const { Players, Fleets, Scores, Offers, Pumps } = require('./ServerStoring');
const { ConfigCache } = require('./ConfigLoader.js');
const { EmulatorHandleMessageChatComposer } = require('./Emulator/EmulatorActions/Emu.ChatComposer.js');
const pool = require('./Database/CreateConnection');

function HandleConnection(Peer, Engine) {

    const PlayerID = Peer.id;

    Players[PlayerID] = {
        ObjectDBID: null,
        ObjectID: PlayerID,
        ObjectData: {
            position: { x: 2, y: -1.3, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            keys: {
                forward: false,
                left: false,
                right: false,
                backward: false,
                jump: false
            },
            last_action: new Date(),
        },
        ItemStates: {
            gun: { ammo: Infinity, rotation: 0 },
            cannon: { ammo: 0, rotation: 0 },
            rod: { LastDirection: {}, LastPosition: {} }
        },
        ValueStates: {
            gold: { amount: Number(ConfigCache.Players.StartMoney) },
            wood: { amount: 0 }
        },
        ObjectGame: {
            dead: false,
            inship: null,
            groupid: null,
            docked: false,
            s1: { wearing: false, item: false },
            s2: { wearing: false, item: false },
            s3: { wearing: false, item: false },
            s4: { wearing: false, item: false },
            s5: { wearing: false, item: false },
            LastShootGun: 0,
            island: null,
            fishing: false,
            rank: 'Guest',
            clan: '',
            xp: 0,
            kills: 0,
            deaths: 0,
            auth: false,
            account: false,
            connected: true,
            holdmouse: false
        },
        GainedValues: {
            peakgold: 0,
            xp: 0,
            kills: 0,
            deaths: 0
        },
        ShopVehicleStates: {
            s1: { wearing: true, owned: true, id: 1 }
        },
        StateLogs: {
            LastVehiclePos: { x: 0, y: 0, z: 0 }
        }
    };

    if (ConfigCache.Server.Debug) console.log(
        '',
        'ID=' + Peer.id,
        'EngineActive=' + (Engine ? 'yes' : 'no')
    );

    if (!Players) {
        if (ConfigCache.Server.Debug) console.log(
            '',
            'PlayersObject' + 'Not Found'
        );
    }

    Peer.emit('scores', {
        AllTime: Scores
    })
}

function HandleDisConnection(Peer, Engine) {
    const PlayerID = Peer.id;

    if (Players[PlayerID]) {
        const player = Players[PlayerID];

        if (player.ObjectDBID && player.ObjectGame?.account) {
            pool.query('UPDATE users SET online = 0 WHERE id = ?', [player.ObjectDBID], (err) => {
                if (err) {
                    console.error(`⚠️ Failed to set user ${player.ObjectDBID} offline:`, err);
                } else if (ConfigCache.Server.Debug) {
                    console.log(`👋 User ${player.ObjectDBID} is now offline.`);
                }
            });
        }

        player.ObjectGame.connected = false;
        player.GainedValues.deaths += 1;

        const shipID = player.ObjectGame.inship;
        if (shipID in Fleets)
            Engine.emit('RemovePlayerFromFleet', PlayerID, Fleets[shipID].ObjectID);

        EmulatorHandleMessageChatComposer(Engine, Peer, {
            Message: `[${player.ObjectGame.rank}] ${player.ObjectName || "Unknown"} left the game.`,
            SenderName: 'Server',
            GlobalMsg: true
        });


        const CachePumpIDs = [];

        for (let i = Pumps.length - 1; i >= 0; i--) {
            if (Pumps[i].ownerId === PlayerID) {
                CachePumpIDs.push(Pumps[i].id);
                Pumps.splice(i, 1);
            }
        }

        if (CachePumpIDs.length > 0) {
            Engine.emit('DeletePumps', CachePumpIDs);
            if (ConfigCache.Server.Debug)
                console.log(`[Pumps] Removed ${CachePumpIDs.length} pumps of player ${PlayerID}`, CachePumpIDs);
        }

        setTimeout(() => {
            delete Players[PlayerID];
        }, 5000);

        if (ConfigCache.Server.Debug)
            console.log('' + '', 'Player Object Deleted.');

        Engine.emit('RemovePlayer', PlayerID);
    } else {
        if (ConfigCache.Server.Debug)
            console.log('' + '', 'Player Object Already Destroyed or Not Found');
    }

    // Clean up fleets owned by this player
    let TargetFleetTR_ID = null;
    for (const id in Fleets) {
        if (Fleets[id].Owner === PlayerID) {
            TargetFleetTR_ID = id;
            break;
        }
    }

    if (TargetFleetTR_ID && Fleets[TargetFleetTR_ID]) {
        if (ConfigCache.Server.Debug)
            console.log('', 'Fleet found on disconnect. Removing ...');

        delete Fleets[TargetFleetTR_ID];
        Engine.emit('DeleteFleet', TargetFleetTR_ID);

        if (ConfigCache.Server.Debug)
            console.log('' + '', 'Fleet removed and emitted.');
    }

    // Remove offers by player
    const RemovedOffers = Offers.filter(offer => offer.ownerID === PlayerID);
    for (const offer of RemovedOffers) {
        const index = Offers.indexOf(offer);
        if (index !== -1) Offers.splice(index, 1);
    }

    if (RemovedOffers.length > 0)
        Engine.emit('market_offers_update', Offers);
}

module.exports = {
    HandleConnection,
    HandleDisConnection
};
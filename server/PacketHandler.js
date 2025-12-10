const { Players, Fleets, ShopVehicles, Sharks} = require("./ServerStoring.js");
const { GetGameLeaderboardScores } = require('./GetDataClass.js');
const { ConfigCache } = require('./ConfigLoader.js');
const {
    EmulatorUpdateGold,
    EmulatorCreatePlayer,
    EmulatorCreateShip,
    EmulatorUseRod,
    EmulatorAddPlayerToShip,
    EmulatorHandleMessageChatComposer,
    EmuWSHandleMarketPost,
    EmuWSHandleMarketBuy,
    EmuWSHandleMarketCancel,
    EmulatorUseCannon,
    EmulatorRequestDepartShip,
    EmulatorPlaceSaltPump
} = require('./Emulator/EmulatorExporter.js');
const { HandleDisConnection } = require('./HandleConnectionStates.js');
const { DBHandleAuth } = require('./Database/HandleAuth.js')

function EnginePacketHandler(Peer, Engine) {

    // Handle disconnect
    Peer.on('disconnect', () => {
        HandleDisConnection(Peer, Engine);
    });

    // Hold mouse states
    Peer.on('h_mouse', (bool) => {
        if (!Players[Peer.id]) return;

        Players[Peer.id].ObjectGame.holdmouse = bool;
    })

    // Key true, false staes
    Peer.on('key', (data) => {
        if (!Players[Peer.id]) return;
        const PlayerID = Peer.id;
        const { k, d } = data;
        if (Players[PlayerID] && Players[PlayerID].ObjectData.keys.hasOwnProperty(k)) {
            Players[PlayerID].ObjectData.keys[k] = d;
        }
        Players[PlayerID].ObjectData.last_action = new Date();
    });

    // Ping
    Peer.on("0", (i) => {
        Peer.emit("0", i);
    });

    // Handle chat messages
    Peer.on('chat.message', (msg) => {
        EmulatorHandleMessageChatComposer(Engine, Peer, {
            Message: msg.message,
            SenderName: '[' + Players[Peer.id]?.ObjectGame.rank + '] ' + (Players[Peer.id]?.ObjectName || "Unknown"),
            GlobalMsg: true
        });
    })

    // Client mouse updates
    Peer.on('MMV', (ObjPool) => {
        const PlayerID = Peer.id;
        if (!Players[PlayerID]) return;

        const PlayerYaw = ObjPool.yaw; // yaw
        const PlayerGRot = ObjPool.GRot; // if item, item x rot

        if (typeof PlayerYaw !== 'number' || isNaN(PlayerYaw) ||
            typeof PlayerGRot !== 'number' || isNaN(PlayerGRot)) {
            return;
        }

        Players[PlayerID].ObjectData.rotation.y = PlayerYaw;
        Players[PlayerID].ItemStates.cannon.rotation = PlayerGRot;
        Players[PlayerID].ObjectData.last_action = new Date();
    });


    // Equip vehicle
    Peer.on('s_e', (o) => {
        const { page, item } = o;
        if (page !== 1) return;

        const TargetPlayer = Players[Peer.id];
        if (!TargetPlayer) return;

        const vehicleKey = `s${item}`;
        const TargetItem = TargetPlayer.ShopVehicleStates?.[vehicleKey];
        if (!TargetItem) return Peer.emit('s_err', 'Vehicle not found');

        if (!TargetPlayer.ObjectGame?.docked) {
            return Peer.emit('s_err', 'You must dock to equip this Vehicle');
        }

        // Delete old fleet if exists
        if (Fleets[TargetPlayer.ObjectID]) {
            TargetPlayer.StateLogs.LastVehiclePos = Fleets[TargetPlayer.ObjectID].ObjectData.position;
            Engine.emit('DeleteFleet', Fleets[TargetPlayer.ObjectID].ObjectID);
            delete Fleets[TargetPlayer.ObjectID];
        }

        // Unequip all other vehicles
        for (const key in TargetPlayer.ShopVehicleStates) {
            if (key.startsWith('s')) TargetPlayer.ShopVehicleStates[key].wearing = false;
        }

        TargetItem.wearing = true;

        // --- Get model name from ShopVehicles using vehicleKey ---
        const modelData = ShopVehicles[vehicleKey];
        const modelName = modelData?.name || 'StarterRaft';

        const PlayerID = TargetPlayer.ObjectID
        const FleetId = TargetPlayer.ObjectID
            Fleets[FleetId] = {
                ObjectID: FleetId,
                ObjectName: `${Players[PlayerID].ObjectName}'s Fleet`,
                ObjectData: {
                    position: TargetPlayer.StateLogs.LastVehiclePos || { x: 0, y: -1, z: 0 },
                    rotation: { x: 0, y: Math.random() * 2 * Math.PI, z: 0 },
                    sailing: false,
                    steer: null,
                    sinking: false
                },
                ObjectGame: {
                    health: { amount: modelData.health, max: modelData.health },
                    model: modelName,
                    LastSharkDamage: 0,
                    crew: modelData.crew,
                    cargo: 0,
                             maxCrew: modelData.maxCrew || 4,
                maxCargo: modelData.maxCargo || 50,
                },
                Owner: PlayerID,
                Invite: Array.from({ length: 8 }, () =>
                    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
                    Math.floor(Math.random() * 62)
                    ]
                ).join('')
            };

        Engine.emit('update_ship_health', {
            fleetid: Fleets[TargetPlayer.ObjectID].ObjectID,
            health: Fleets[TargetPlayer.ObjectID].ObjectGame.health.amount,
            maxhealth: Fleets[TargetPlayer.ObjectID].ObjectGame.health.max
        })

        Engine.emit('CreateFleet', { FleetPayload: Fleets[TargetPlayer.ObjectID] });
        Engine.emit('FleetDockDepart', { fleetid: Fleets[TargetPlayer.ObjectID].ObjectID, actiondock: true });

        Peer.emit('s_equipped', { page: 1, item });

        const fleetID = Fleets[TargetPlayer.ObjectID].Owner; // patch soon on captain switch
        const FleetCrew = Object.values(Players)
            .filter(p => p.ObjectGame?.groupid === fleetID) // groupid
            .map(p => p.ObjectID);

const ShipImg = (() => {
    const name = (modelData.name || "").toLowerCase();

    if (name.includes("raft")) return 't1';
    if (name.includes("boat")) return 't4';

    return 't1'; // fallback
})();

        const payload = {
            img: ShipImg,
            shipname: Fleets[fleetID].ObjectName,
            shipclass: Fleets[fleetID].ObjectGame.model,
            health: Fleets[fleetID].ObjectGame.health.amount,
            maxhealth: Fleets[fleetID].ObjectGame.health.max,
            crew: FleetCrew.length,
            maxcrew: Fleets[fleetID].ObjectGame.maxCrew,
            cargo: Fleets[fleetID].ObjectGame.cargo,
            maxcargo: Fleets[fleetID].ObjectGame.maxCargo
        };

        FleetCrew.forEach(playerID => {
            Engine.to(playerID).emit('ShipPackageStatus', payload);
        });
    });

    Peer.on("s_sell", (o) => { // sell vehicle
        const { page, item } = o;
        if (page !== 1) return;

        const TargetPlayer = Players[Peer.id];
        if (!TargetPlayer) return;

        const VehicleKey = `s${item}`;
        const TargetItem = TargetPlayer.ShopVehicleStates?.[VehicleKey];
        const ShopVehicle = ShopVehicles?.[VehicleKey];

        // verify checks
        if (!ShopVehicle) return Peer.emit("s_err", "This Vehicle does not exist");
        if (!TargetItem?.owned) return Peer.emit("s_err", "You do not own this Vehicle");
        if (!TargetPlayer.ObjectGame?.docked) return Peer.emit("s_err", "You must dock to sell this Vehicle");

        TargetPlayer.ValueStates.gold.amount += Math.floor(ShopVehicle.price * 0.75);

        Peer.emit("s_sold", { page: 1, item });

        EmulatorUpdateGold(Engine, Peer, 0)

        // Delete fleet if the sold vehicle was equipped
        if (TargetItem.wearing && Fleets[TargetPlayer.ObjectID]) {
            TargetPlayer.StateLogs.LastVehiclePos = Fleets[TargetPlayer.ObjectID].ObjectData.position;
            Engine.emit('DeleteFleet', Fleets[TargetPlayer.ObjectID].ObjectID);
            delete Fleets[TargetPlayer.ObjectID];
        }

        delete TargetPlayer.ShopVehicleStates[VehicleKey];
    });


    // buy ships, items
    Peer.on("s_b", (o) => {
        const TargetPlayer = Players[Peer.id];
        if (!TargetPlayer) return;

        const { page, item } = o;

        if (page === 2) { // shop items category
            console.log(item);

            if (item === 1) { // fishing rod
                const rodPrice = 500;
                if (TargetPlayer.ValueStates.gold.amount < rodPrice) {
                    Peer.emit('s_err', 'Not enough gold to buy this fishing rod');
                    return;
                }

                let hasRod = false;
                for (let i = 1; i <= 5; i++) {
                    const slot = TargetPlayer.ObjectGame[`s${i}`];
                    if (slot?.item === 'fishingrod' && slot.owned) {
                        hasRod = true;
                        break;
                    }
                }
                if (hasRod) {
                    Peer.emit('s_err', 'You already own a fishing rod');
                    return;
                }

                let availableSlot = null, availableSlotNum = null;
                for (let i = 1; i <= 5; i++) {
                    const slot = TargetPlayer.ObjectGame[`s${i}`];
                    if (slot && (!slot.item || slot.item === false)) {
                        availableSlot = `s${i}`;
                        availableSlotNum = i;
                        break;
                    }
                }
                if (!availableSlot) {
                    Peer.emit('s_err', 'No available inventory slot for fishing rod');
                    return;
                }

                TargetPlayer.ObjectGame[availableSlot] = {
                    item: 'fishingrod',
                    wearing: false,
                    owned: true
                };

                Peer.emit('inv_slot', { slot: availableSlotNum, item: 'rod' });

                Players[Peer.id].ValueStates.gold.amount -= rodPrice;

                Engine.to(Peer.id).emit('UValues', {
                    gold: Players[Peer.id].ValueStates.gold.amount,
                    wood: Players[Peer.id].ValueStates.wood.amount
                });

                if (ConfigCache.Server.Debug)
                    console.log(`[Server] Player ${Peer.id} bought fishing rod in slot ${availableSlot}`);
            }

            if (item === 2) { // Cannon
                const cannonPrice = 500;
                if (TargetPlayer.ValueStates.gold.amount < cannonPrice) {
                    Peer.emit('s_err', 'Not enough gold to buy this cannon');
                    return;
                }

                // Check if player already owns one
                let hasCannon = false;
                for (let i = 1; i <= 5; i++) {
                    const slot = TargetPlayer.ObjectGame[`s${i}`];
                    if (slot?.item === 'cannon' && slot.owned) {
                        hasCannon = true;
                        break;
                    }
                }
                if (hasCannon) {
                    Peer.emit('s_err', 'You already own a cannon');
                    return;
                }

                // Find first empty slot
                let availableSlot = null, availableSlotNum = null;
                for (let i = 1; i <= 5; i++) {
                    const slot = TargetPlayer.ObjectGame[`s${i}`];
                    if (slot && (!slot.item || slot.item === false)) {
                        availableSlot = `s${i}`;
                        availableSlotNum = i;
                        break;
                    }
                }
                if (!availableSlot) {
                    Peer.emit('s_err', 'No available inventory slot for cannon');
                    return;
                }

                // Give cannon
                TargetPlayer.ObjectGame[availableSlot] = {
                    item: 'cannon',
                    wearing: false,
                    owned: true
                };

                Peer.emit('inv_slot', { slot: availableSlotNum, item: 'cannon' });

                Players[Peer.id].ValueStates.gold.amount -= cannonPrice;

                Peer.emit('UValues', {
                    gold: Players[Peer.id].ValueStates.gold.amount,
                    wood: Players[Peer.id].ValueStates.wood.amount
                });

                if (ConfigCache.Server.Debug)
                    console.log(`[Server] Player ${Peer.id} bought cannon in slot ${availableSlot}`);
            }

            if (item === 3) { // salt pump
                const pumpPrice = 8000;

                // not enough gold
                if (TargetPlayer.ValueStates.gold.amount < pumpPrice) {
                    Peer.emit('s_err', 'Not enough gold to buy a salt pump');
                    return;
                }

                // check if user already owns a pump
                let hasPump = false;
                for (let i = 1; i <= 5; i++) {
                    const slot = TargetPlayer.ObjectGame[`s${i}`];
                    if (slot?.item === 'pump' && slot.owned) {
                        hasPump = true;
                        break;
                    }
                }
                if (hasPump) {
                    Peer.emit('s_err', 'You already own a salt pump');
                    return;
                }

                // find empty inventory slot
                let availableSlot = null, availableSlotNum = null;
                for (let i = 1; i <= 5; i++) {
                    const slot = TargetPlayer.ObjectGame[`s${i}`];
                    if (slot && (!slot.item || slot.item === false)) {
                        availableSlot = `s${i}`;
                        availableSlotNum = i;
                        break;
                    }
                }

                if (!availableSlot) {
                    Peer.emit('s_err', 'No available inventory slot for salt pump');
                    return;
                }

                // give pump
                TargetPlayer.ObjectGame[availableSlot] = {
                    item: 'pump',
                    wearing: false,
                    owned: true
                };

                Peer.emit('inv_slot', { slot: availableSlotNum, item: 'pump' });

                Players[Peer.id].ValueStates.gold.amount -= pumpPrice;

                if (ConfigCache.Server.Debug)
                    console.log(`[Server] Player ${Peer.id} bought salt pump in slot ${availableSlot}`);
            }

        }

        if (page === 1) {
            const TargetPlayer = Players[Peer.id];
            if (!TargetPlayer) return;

            // vehicle state check
            const VehicleKey = `s${item}`;
            const ShopVehicle = ShopVehicles[VehicleKey];
            if (!ShopVehicle) {
                Peer.emit("s_err", "This vehicle does not exist.");
                return;
            }

            if (ShopVehicle.airspace === true) {
                Peer.emit("s_err", "There is no air space available on your vehicle.");
                return;
            }

            if (!TargetPlayer.ShopVehicleStates)
                TargetPlayer.ShopVehicleStates = {};

            const TargetItem = TargetPlayer.ShopVehicleStates[VehicleKey];

            // Already owned check
            if (TargetItem?.owned) {
                Peer.emit("s_err", "You already own this vehicle.");
                return;
            }

            // Gold check
            if (TargetPlayer.ValueStates.gold.amount < ShopVehicle.price) {
                Peer.emit("s_err", "You do not have enough gold for this vehicle.");
                return;
            }

            // give the vehicle
            TargetPlayer.ShopVehicleStates[VehicleKey] = {
                owned: true,
                wearing: false,
                id: item
            };

            Peer.emit("s_o", {
                page: 1,
                item: item
            });

            EmulatorUpdateGold(Engine, Peer, -ShopVehicle.price);

            if (ConfigCache.Server.Debug)
                console.log(`[Server] Player ${Peer.id} bought vehicle ${ShopVehicle.name}`);
        }

    });


    // play states
    Peer.on('play', (Obj) => {
        if (Players[Peer.id].ObjectGame.auth === false) {
            Peer.disconnect(0)
            return;
        }

        const InviteKey = Obj.InviteKey || null;

        let InviteID = null;
        let FleetSailing = true;

        for (const fid in Fleets) {
            if (Fleets[fid].Invite === InviteKey) {
                InviteID = fid;
                FleetSailing = Fleets[fid].ObjectData.sailing;
                break;
            }
        }

        EmulatorCreatePlayer(Engine, Peer, Obj); // Always create player on join

        if (InviteID && FleetSailing) { // Joins sailing fleet
            EmulatorAddPlayerToShip(Engine, Peer, {
                ShipID: InviteID,
                PlayerID: Peer.id
            });
        } else if (InviteID && !FleetSailing) { // Joins docked fleet
            Players[Peer.id].ObjectGame.groupid = InviteID;
            Players[Peer.id].ObjectGame.docked = true;
            Players[Peer.id].ObjectGame.inship = null;
            Players[Peer.id].ObjectData.position.x = Fleets[Players[Peer.id].ObjectGame.groupid].ObjectData.position.x;
            Players[Peer.id].ObjectData.position.z = Fleets[Players[Peer.id].ObjectGame.groupid].ObjectData.position.z;
        } else { // Create new fleet for player
            EmulatorCreateShip(Engine, Peer, null);
            EmulatorAddPlayerToShip(Engine, Peer, {
                ShipID: Peer.id,
                PlayerID: Peer.id
            });
        }
        Peer.emit('leadscores', GetGameLeaderboardScores());
        Peer.emit('SharksTotals', Sharks);
        EmulatorUpdateGold(Engine, Peer, 0);
    });


    // Change item slot
    Peer.on('CSlot', (slotNumber) => {
        if (!Players[Peer.id]) return;

        const playerId = Peer.id;
        const player = Players[playerId];
        if (!player || !player.ObjectGame) return;

        const objectGame = player.ObjectGame;

        Peer.emit('CSlot', slotNumber);

        const selectedSlot = objectGame[`s${slotNumber}`];


        // rod equip
        const wornRodSlots = [];
        for (let i = 1; i <= 5; i++) {
            const slot = objectGame[`s${i}`];
            if (slot && slot.item === 'fishingrod' && slot.wearing) {
                wornRodSlots.push(i);
            }
        }

        if (selectedSlot?.item !== 'fishingrod') {
            wornRodSlots.forEach(i => {
                Engine.emit('PullRope', playerId);
                Engine.emit('DeleteRod', playerId);
                objectGame[`s${i}`].wearing = false;
                player.ObjectGame.fishing = false;
            });
        }

        if (selectedSlot?.item === 'fishingrod' && !selectedSlot.wearing) {
            Engine.emit('EquipRod', playerId);
            selectedSlot.wearing = true;
        }

        // cannon equip / unequip
        const wornCannonSlots = [];
        for (let i = 1; i <= 5; i++) {
            const slot = objectGame[`s${i}`];
            if (slot && slot.item === 'cannon' && slot.wearing) {
                wornCannonSlots.push(i);
            }
        }

        if (selectedSlot?.item !== 'cannon' && wornCannonSlots.length > 0) {
            wornCannonSlots.forEach(i => {
                Engine.emit('DeleteCannon', playerId);
                objectGame[`s${i}`].wearing = false;
            });
        }

        if (selectedSlot?.item === 'cannon' && !selectedSlot.wearing) {
            Engine.emit('EquipCannon', playerId);
            selectedSlot.wearing = true;
        }


        // salt pump equip / unequip
        const wornPumpSlots = [];
        for (let i = 1; i <= 5; i++) {
            const slot = objectGame[`s${i}`];
            if (slot && slot.item === 'pump' && slot.wearing) {
                wornPumpSlots.push(i);
            }
        }

        // Unequip pump
        if (selectedSlot?.item !== 'pump' && wornPumpSlots.length > 0) {
            wornPumpSlots.forEach(i => {
                Engine.to(Peer.id).emit('DeletePump');
                objectGame[`s${i}`].wearing = false;
            });
        }

        // Equip pump
        if (selectedSlot?.item === 'pump' && !selectedSlot.wearing) {
            Engine.to(Peer.id).emit('EquipPump');
            selectedSlot.wearing = true;
        }


    });


    // Use item states
    Peer.on('use_item', ({ Item, Payload }) => {
        if (!Players[Peer.id]) return;

        const player = Players[Peer.id];

        if (Item === 'rod') {
            EmulatorUseRod(Engine, Peer.id, player);
        }

        if (Item === 'cannon') {
            EmulatorUseCannon(Engine, Peer.id, player)
        }

        if (Item === 'pump') {
            EmulatorPlaceSaltPump(Engine, Peer, player, Payload)
        }

    });

    Peer.on('depart', () => {
        EmulatorRequestDepartShip(Engine, Peer, null)
    });

    Peer.on('market_post', (data) => {
        EmuWSHandleMarketPost(data, Engine, Peer);
    });

    Peer.on('market_buy', (data) => {
        EmuWSHandleMarketBuy(data, Engine, Peer);
    });

    Peer.on('market_cancel', (data) => {
        EmuWSHandleMarketCancel(data, Engine, Peer);
    });

    Peer.on('auth', (token) => {
        DBHandleAuth(Engine, Peer, token)
    });
}


module.exports = {
    EnginePacketHandler
}
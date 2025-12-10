import * as THREE from 'three';
import { MachineClient, ServerTempCache } from './global.js';
import { ModelCache } from './Loaders/preloader.js';
import { animate } from './main.js';
import { SetupWorld1 } from './world1.js';
import { AddInvSlot, SetInvActiveSlot } from './UIClasses/SlotActions.js';
import { EquipGun, DeleteGun, EquipRod, DeleteRod, EquipCannon, DeleteCannon } from './PlayerItemsClasses/PlayerItemStates.js'
import { SpawnIsland } from './IslandModel.js';
import { Cleanup_Crates } from './ServerStates/CratesModal.js';
import { ThrowWelcomeIsland, SetFleetTransparency } from './DockingModels.js';
import { SetupLeaderboardClass } from './UIClasses/LeaderboardClass.js';
import { ThrowShopError, OwnedShipBtnUpdates, SoldShipBtnUpdates } from './UIClasses/UIShoppingClass.js';
import { ValueFormatter } from './math.js';
import { ThrowRod, PullRope, FishOutCube } from './PlayerItemsClasses/FishingRod.js'
import { SpawnShark } from './SpawnShark.js';
import { CastMessage, FreezeChat } from './UIClasses/ChatModel.js';
import { PlaySound } from './audio/audio_player.js';

const socket = MachineClient.ClientNetPeer;
let IsSetup = false;

socket.on('connect', () => {
    console.log('Connected to server');

    setTimeout(() => {
        const token = localStorage.getItem('shipz_auth_token');

        if (token) {
            MachineClient.ClientNetPeer.emit('auth', token);
        } else {
            MachineClient.ClientNetPeer.emit('auth', 'x');
        }
    }, 1000)

    let found = false;

    const IslandOctecChecker = setInterval(() => {
        if (!found && ModelCache['island']) {
            SpawnIsland('Jamaica', { x: 0, y: -1, z: 0 });
            SpawnIsland('Bahamas', { x: 500, y: -1, z: 500 });
            SpawnIsland('Cuba', { x: -500, y: -1, z: 500 });
            SpawnIsland('Tobago', { x: -500, y: -1, z: -500 });
            SpawnIsland('Niger', { x: 500, y: -1, z: -500 });
            found = true;
            clearInterval(IslandOctecChecker);
        }
    }, 100);

    if (IsSetup === false) {
        MachineClient.ClientMenu = true;
        SetupWorld1();
        animate();
        IsSetup = true;
    }
});

socket.on('auth_ok', () => {
    const invite = localStorage.getItem('shipz_invite_token');

    setTimeout(() => {
        MachineClient.ClientNetPeer.emit('play', {
            ClassUID: '',
            InviteKey: invite
        });
    }, 500);
})

socket.on('welcome', () => {
    document.getElementsByClassName('gameclient')[0].style.display = 'block';
    MachineClient.ClientMenu = false;
})

socket.on('temp_cache', (o) => {
    const { item, payload } = o;
    if (typeof item === 'string') {
        ServerTempCache[item] = payload;
    }
});

export function ThrowPing() {
    if (!document.hidden) {
        socket.emit("0", Date.now());
    }
}

socket.on('s_o', (o) => {
    const { page, item } = o;

    if (page === 1) {
        OwnedShipBtnUpdates(item)
    }
})

socket.on('s_sold', (o) => {
    const { page, item } = o;

    if (page === 1) {
        SoldShipBtnUpdates(item)
    }
})

socket.on('s_err', (m) => {
    ThrowShopError(m, 3000);
})

socket.on("0", (CT) => {
    MachineClient.ClientPingTime = Date.now() - CT
    if (MachineClient.ClientMenu === true) {
        // document.getElementsByClassName('value-m-ping')[0].innerHTML = Date.now() - CT + ' ms';
    }
});

socket.on('disconnect', () => {
    console.log('Connection closed.');
    MachineClient.ClientMenu = true;
    alert('Disconnected from server. Connection not saved. Refresh to reconnect.');
    Cleanup_Crates();
})

socket.on('binary ack', (d) => {
    console.log('bin' + d);
})

socket.on('inv_slot', (payload) => {
    const SlotValue = payload.slot;
    const SlotItem = payload.item;

    AddInvSlot(SlotValue, './assets/icons/' + SlotItem + '.png');
    if (SlotItem === 'gun1') SetInvActiveSlot(SlotValue);
})

socket.on('CSlot', (i) => {
    SetInvActiveSlot(i);
})

socket.on('UPT', ({ P, F, B, S }) => {
    const MyPlayer = MachineClient.ClientStoredPlayers[socket.id];

    for (const id in P) {
        const [x, y, z, rotY, gunRot] = P[id];
        const player = MachineClient.ClientStoredPlayers[id];
        if (!player) continue;

        player.targetPos.set(x, y, z);
        player.TargetGunRotationStateX = gunRot;

        if (id !== MachineClient.ClientStoredClientID) {
            player.obj.rotation.y = rotY;
        }
    }

    for (const id in F) {
        const [x, y, z, rotX, rotY, rotZ, lean] = F[id]; 
        const fleet = MachineClient.ClientStoredRafts[id];
        if (!fleet) continue;

        // Set target position
        fleet.targetPos.set(x, y, z);

        // Set target rotation
        fleet.targetRot.set(rotX, rotY, rotZ);

        fleet.lean = lean;
    }



    const activeIds = new Set(B.map(b => b[0]));

    for (const bulletData of B) {
        const [id, x, y, z, dx, dy, dz, type] = bulletData; // str 'abc'
        let bullet = MachineClient.ClientStoredBullets.find(b => b.id === id);

        if (!bullet) {

            const geo = new THREE.SphereGeometry(0.4, 16, 16);
            const mat = new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.8,
                metalness: 0.2,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, y, z);
            MachineClient.GlobalDefineWorld.add(mesh);

            // red flame trail
            const flameCount = 20; // longer trail
            const flameMeshes = [];

            for (let j = 0; j < flameCount; j++) {
                const flameGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);

                const colorMix = new THREE.Color().lerpColors(
                    new THREE.Color(0xffdd00), // bright near start
                    new THREE.Color(0xaa0000), // dark red at end
                    j / flameCount
                );

                const flameMat = new THREE.MeshStandardMaterial({
                    color: colorMix,
                    emissive: colorMix,
                    emissiveIntensity: 2.5 - (j / flameCount) * 1.5,
                    roughness: 0.3,
                    metalness: 0.0,
                    transparent: true,
                    opacity: 0.95 - j * 0.03,
                });

                const flame = new THREE.Mesh(flameGeo, flameMat);
                flame.scale.setScalar(1.2 - j / (flameCount * 0.8)); // flames near ball
                flame.position.set(x, y, z);
                MachineClient.GlobalDefineWorld.add(flame);
                flameMeshes.push(flame);
            }

            bullet = {
                id,
                mesh,
                targetPos: new THREE.Vector3(x, y, z),
                dir: new THREE.Vector3(dx, dy, dz),
                flameMeshes,
                flameTimer: 0,
                type: 'cannonball',
            };

            MachineClient.ClientStoredBullets.push(bullet);


            // sound effect
            if (MyPlayer.obj) {
                const playerPos = new THREE.Vector3();
                MyPlayer.obj.getWorldPosition(playerPos);
                const bulletPos = new THREE.Vector3(x, y, z);
                const distance = bulletPos.distanceTo(playerPos);

                const minDistance = 5;
                const maxDistance = 400;
                const maxVolume = 0.7;
                let volume = maxVolume;

                if (distance <= minDistance) {
                    volume = maxVolume;
                } else if (distance >= maxDistance) {
                    volume = 0;
                } else {
                    const t = (distance - minDistance) / (maxDistance - minDistance);
                    volume = maxVolume * (1 - Math.pow(t, 0.5));
                    if (distance > 20) volume *= 0.7;
                    const extraSteps = Math.floor((distance - 20) / 30);
                    volume *= Math.pow(0.9, extraSteps);
                }

                volume = Math.min(Math.max(volume, 0), 1);
                PlaySound('cannon_fire', volume); // use your cannon sound here
            }

        } else {
            // Smooth motion update
            bullet.targetPos.set(x, y, z);
        }
    }

    // cannonball cleanup
    for (let i = MachineClient.ClientStoredBullets.length - 1; i >= 0; i--) {
        const b = MachineClient.ClientStoredBullets[i];

        if (!activeIds.has(b.id)) {
            // Remove the cannonball mesh
            if (b.mesh.parent) b.mesh.parent.remove(b.mesh);
            b.mesh.geometry.dispose();
            b.mesh.material.dispose();

            // Remove all flame trail cubes
            if (b.flameMeshes) {
                for (const f of b.flameMeshes) {
                    if (f.parent) f.parent.remove(f);
                    f.geometry.dispose();
                    f.material.dispose();
                }
            }

            // Remove from stored bullets
            MachineClient.ClientStoredBullets.splice(i, 1);
        }
    }


    for (const id in S) {
        const [x, y, z, rotY] = S[id];
        let shark = MachineClient.ClientStoredSharks[id];

        if (!shark) {
            SpawnShark({
                ObjectID: id,
                ObjectData: {
                    position: { x, y, z }
                }
            });
        } else {
            shark.targetPos.set(x, y, z);
            shark.rotationY = rotY;
        }
    }

    for (const id in MachineClient.ClientStoredSharks) {
        if (!S[id]) {
            const shark = MachineClient.ClientStoredSharks[id];
            if (shark.obj && shark.obj.parent) shark.obj.parent.remove(shark.obj);
            delete MachineClient.ClientStoredSharks[id];
        }
    }
});




socket.on('CreatePlayer', (Obj) => {
    CreatePlayer(Obj.PlayerPayload);
});

socket.on('ExistPlayers', ({ Players }) => {
    Players.forEach(payload => {
        if (!MachineClient.ClientStoredPlayers[payload.ObjectID]) {
            CreatePlayer(payload);
        }
    });
});

socket.on('ExistingFleets', ({ Fleets }) => {
    Fleets.forEach(payload => {
        if (!MachineClient.ClientStoredRafts[payload.ObjectID]) {
            CreateFleet(payload);
        }
    })
})
socket.on('SyncObjectStates', (ServerPlayers, ServerFleets) => {

    // --- Get local player's world position ---
    const localPlayerObj = MachineClient.ClientStoredPlayers[MachineClient.ClientStoredClientID];
    if (!localPlayerObj) return; // local player not yet loaded

    const localPlayerWorldPos = new THREE.Vector3();
    if (localPlayerObj.mesh) {
        localPlayerObj.mesh.getWorldPosition(localPlayerWorldPos);
    } else if (localPlayerObj.position) {
        localPlayerWorldPos.copy(localPlayerObj.position);
    }

    // --- Remove players that no longer exist ---
    Object.keys(MachineClient.ClientStoredPlayers).forEach(id => {
        if (!ServerPlayers.find(p => p.ObjectID === id)) RemovePlayer(id);
    });

    // --- Add or update players within range ---
    ServerPlayers.forEach(p => {
        const serverPos = new THREE.Vector3(
            p.ObjectGame?.position?.x || 0,
            p.ObjectGame?.position?.y || 0,
            p.ObjectGame?.position?.z || 0
        );

        // Skip if player is too far
        if (localPlayerWorldPos.distanceTo(serverPos) > 400) return;

        // Create player if doesn't exist
        let storedPlayer = MachineClient.ClientStoredPlayers[p.ObjectID];
        if (!storedPlayer) {
            CreatePlayer(p);
            storedPlayer = MachineClient.ClientStoredPlayers[p.ObjectID];
        }

        // --- Handle ships/fleets ---
        const isDocked = p.ObjectGame?.docked;
        if (p.ObjectGame?.inship && !isDocked && ServerFleets.find(f => f.ObjectID === p.ObjectGame.inship)) {
            AddPlayerToRaft(p.ObjectID, p.ObjectGame.inship);
        } else if (storedPlayer?.currentRaft) {
            RemovePlayerFromRaft(p.ObjectID, storedPlayer.currentRaft);
        }

        // --- Handle fishing rods ---
        const serverFishing = p.ObjectGame?.fishing;
        const rodState = p.ItemStates?.rod;
        if (!storedPlayer.fishing && serverFishing && rodState && storedPlayer.rodObj) {
            const LastPosVector = new THREE.Vector3(
                rodState.LastPosition.x,
                rodState.LastPosition.y,
                rodState.LastPosition.z
            );
            const LastDirection = new THREE.Vector3(
                rodState.LastDirection.x,
                rodState.LastDirection.y,
                rodState.LastDirection.z
            );
            ThrowRod(p.ObjectID, LastPosVector, LastDirection, storedPlayer.rodObj);
            storedPlayer.fishing = true;
        }

        // --- Equip or remove items ---
        const slots = ['s1', 's2', 's3', 's4', 's5'];
        slots.forEach(slot => {
            const itemData = p.ObjectGame?.[slot];
            if (!itemData) return;

            const wearing = itemData.wearing;
            const item = itemData.item;

            if (item && wearing) {
                if (item.toLowerCase().includes('gun') && !storedPlayer.gunObj) EquipGun(p.ObjectID);
                else if (item.toLowerCase().includes('rod') && !storedPlayer.rodObj) EquipRod(p.ObjectID);
            } else {
                if (item && item.toLowerCase().includes('gun') && storedPlayer.gunObj) DeleteGun(p.ObjectID);
                if (item && item.toLowerCase().includes('rod') && storedPlayer.rodObj) DeleteRod(p.ObjectID);
            }
        });
    });

    // --- Remove fleets that no longer exist ---
    Object.keys(MachineClient.ClientStoredRafts).forEach(id => {
        if (!ServerFleets.find(f => f.ObjectID === id)) DeleteRaft(id);
    });

    // --- Add or update fleets within range ---
    ServerFleets.forEach(f => {
        const fleetPos = new THREE.Vector3(
            f.ObjectData?.position?.x || 0,
            f.ObjectData?.position?.y || 0,
            f.ObjectData?.position?.z || 0
        );

        // Skip if fleet is too far
        if (localPlayerWorldPos.distanceTo(fleetPos) > 400) return;

        if (!MachineClient.ClientStoredRafts[f.ObjectID]) CreateFleet(f);

        if (f.ObjectData?.sailing === false) SetFleetTransparency(f.ObjectID, true);
    });

});


socket.on('RemovePlayer', (id) => {
    RemovePlayer(id);
});

socket.on('CreateFleet', (payload) => {
    CreateFleet(payload.FleetPayload)
})

function CreateFleet(payload) {
    const id = payload.ObjectID;
    const pos = payload.ObjectData.position;
    const FName = payload.ObjectName;
    const Health = payload.ObjectGame.health.amount;
    const MaxHealth = payload.ObjectGame.health.max;
    const FleetModel = payload.ObjectGame.model;

    const RaftRoot = new THREE.Group();
    RaftRoot.position.set(pos.x, pos.y, pos.z);

    RaftRoot.frustumCulled = true;

    MachineClient.GlobalDefineWorld.add(RaftRoot);

    const targetPos = new THREE.Vector3(pos.x, pos.y, pos.z);
    const targetRot = new THREE.Vector3(0, 0, 0);
    MachineClient.ClientStoredRafts[id] = {
        obj: RaftRoot,
        lean: 'none',
        targetPos,
        targetRot
    };

    // clone
    if (ModelCache[FleetModel]) {
        const f = ModelCache[FleetModel].clone();
        f.position.y = pos.y;
        f.name = "fleet";
        f.scale.set(1.5, 1.5, 1.5);

        f.traverse(child => {
            if (child.isMesh && child.material) {
                child.material = Array.isArray(child.material)
                    ? child.material.map(mat => mat.clone())
                    : child.material.clone();

            }
        });

        RaftRoot.add(f);
    }

    // --- Name Sprite ---
    const nameCanvas = document.createElement('canvas');
    nameCanvas.width = 1024;
    nameCanvas.height = 192;
    const ctx = nameCanvas.getContext('2d');
    ctx.clearRect(0, 0, nameCanvas.width, nameCanvas.height);
    const fontSize = Math.floor(nameCanvas.height * 0.38);
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const gradient = ctx.createLinearGradient(0, 0, nameCanvas.width, 0);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#c4c4c4');
    ctx.fillStyle = gradient;
    ctx.fillText(FName, nameCanvas.width / 2, nameCanvas.height / 2);

    const nameTexture = new THREE.CanvasTexture(nameCanvas);
    nameTexture.minFilter = THREE.LinearFilter;
    nameTexture.magFilter = THREE.LinearFilter;
    nameTexture.anisotropy = 16;
    nameTexture.needsUpdate = true;

    const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: nameTexture,
        transparent: true,
        depthWrite: false,
        depthTest: true
    }));
    const desiredWidth = 14;
    nameSprite.scale.set(desiredWidth, (nameCanvas.height / nameCanvas.width) * desiredWidth, 1);
    nameSprite.position.set(0, 20, 0);
    nameSprite.renderOrder = 2;
    RaftRoot.add(nameSprite);

    // --- Health Bar ---
    const hpCanvas = document.createElement('canvas');
    hpCanvas.width = 512;
    hpCanvas.height = 32;
    const hpCtx = hpCanvas.getContext('2d');
    hpCtx.clearRect(0, 0, hpCanvas.width, hpCanvas.height);

    function roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    const bgGradient = hpCtx.createLinearGradient(0, 0, 0, hpCanvas.height);
    bgGradient.addColorStop(0, '#ffffff');
    bgGradient.addColorStop(1, '#e0e0e0');
    hpCtx.fillStyle = bgGradient;
    roundRect(hpCtx, 0, 0, hpCanvas.width, hpCanvas.height, 8);

    const hpPercent = Math.max(0, Math.min(Health / MaxHealth, 1));
    const hpGradient = hpCtx.createLinearGradient(0, 0, 0, hpCanvas.height);
    hpGradient.addColorStop(0, '#00bfff');
    hpGradient.addColorStop(1, '#0077b3');
    hpCtx.fillStyle = hpGradient;
    roundRect(hpCtx, 0, 0, hpCanvas.width * hpPercent, hpCanvas.height, 8);

    hpCtx.font = 'bold 24px Verdana';
    hpCtx.fillStyle = '#f8f8f8ff';
    hpCtx.textAlign = 'center';
    hpCtx.textBaseline = 'top';
    hpCtx.fillText(`${Health}/${MaxHealth} HP`, hpCanvas.width / 2, 4);

    const hpTexture = new THREE.CanvasTexture(hpCanvas);
    hpTexture.minFilter = THREE.LinearFilter;
    hpTexture.magFilter = THREE.LinearFilter;
    hpTexture.needsUpdate = true;

    const hpSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: hpTexture,
        transparent: true,
        depthTest: true,
        depthWrite: false
    }));
    hpSprite.scale.set(10, 0.75, 1);
    hpSprite.position.set(0, 18, 0);
    hpSprite.renderOrder = 2;
    RaftRoot.add(hpSprite);

    return RaftRoot;
}



socket.on('DeleteFleet', (id) => {
    DeleteRaft(id);
})

function DeleteRaft(id) {

    const raftData = MachineClient.ClientStoredRafts[id];
    if (!raftData) return; // Raft does not exist

    if (raftData.obj && raftData.obj.parent) {
        raftData.obj.parent.remove(raftData.obj);
    }

    // dispose
    raftData.obj.traverse((child) => {
        if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
    });

    delete MachineClient.ClientStoredRafts[id];
}

function CreatePlayer(payload) {
    const id = payload.ObjectID;
    const pos = payload.ObjectData.position;

    const playerRoot = new THREE.Group();
    playerRoot.position.set(pos.x, pos.y, pos.z);
    MachineClient.GlobalDefineWorld.add(playerRoot);

    const targetPos = new THREE.Vector3(pos.x, pos.y, pos.z);
    MachineClient.ClientStoredPlayers[id] = {
        obj: playerRoot,
        targetPos,
        TargetGunRotationStateX: 0,
        fishing: false
    };

    // --- Name tag with rank icon ---
    const fontSize = 28;
    const fontFamily = 'Arial';
    const ctxTemp = document.createElement('canvas').getContext('2d');
    ctxTemp.font = `${fontSize}px ${fontFamily}`;
    const textWidth = ctxTemp.measureText(payload.ObjectName).width;

    const rankImg = new Image();
    rankImg.src = '../assets/ranks/Silver/rank072.png'; // path to rank icon

    // Higher resolution canvas for better quality
    const scaleFactor = 2; // 2x resolution
    const canvasWidth = Math.max(256, textWidth + 50) * scaleFactor;
    const canvasHeight = 64 * scaleFactor;
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    // scale down drawing for crisp result
    ctx.scale(scaleFactor, scaleFactor);

    rankImg.onload = () => {
        const iconSize = 34; // actual display size
        ctx.drawImage(rankImg, 5, (canvasHeight / scaleFactor - iconSize) / 2, iconSize, iconSize);

        // Draw player name next to rank icon
        ctx.fillStyle = 'white';
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(payload.ObjectName, iconSize + 10, canvasHeight / (2 * scaleFactor));

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 16; // improve texture sharpness on angle

        const spriteMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            depthTest: true
        });

        const NewNameTag = new THREE.Sprite(spriteMat);
        const baseScale = 2;
        NewNameTag.scale.set(baseScale * (canvasWidth / scaleFactor / 256), 0.5, 1);
        NewNameTag.position.set(0, 1.3, 0);
        NewNameTag.renderOrder = 7;
        playerRoot.add(NewNameTag);
    };

    // --- Models ---
    if (ModelCache['egg']) {
        const model = ModelCache['egg'].clone();
        const s = 1
        model.scale.set(s, s, s)
        playerRoot.add(model);
    } else {
        console.warn('player model not yet loaded');
    }

    if (ModelCache['backpack']) {
        const bpscale = 1;
        const backpack = ModelCache['backpack'].clone();
        backpack.position.set(0, 0.45, 0.7);
        backpack.scale.set(bpscale, bpscale, bpscale);
        backpack.name = 'backpack';
        playerRoot.add(backpack);
        MachineClient.ClientStoredPlayers[id].Backpack = backpack;
    }

    if (id === socket.id) {
        MachineClient.ClientStoredClientID = id;
    }

    return playerRoot;
}





socket.on('AddPlayerToFleet', (playerid, raftid) => {
    AddPlayerToRaft(playerid, raftid)
})

function AddPlayerToRaft(playerId, raftId) {
    const playerData = MachineClient.ClientStoredPlayers[playerId];
    const raftData = MachineClient.ClientStoredRafts[raftId];

    if (!playerData) {
        console.warn(`${playerId} not found`);
        return;
    }
    if (!raftData) {
        console.warn(`${raftId} not found`);
        return;
    }

    if (raftData.obj.children.includes(playerData.obj)) {
        return;
    }





    raftData.obj.add(playerData.obj);

    if (playerId === MachineClient.ClientNetPeer.id) { // if incoming id is my client id
        raftData.obj.add(MachineClient.ClientCamera)
        MachineClient.ClientDocked = false;
        MachineClient.ClientStoredShipID = raftId

                MachineClient.ClientCamera.updateMatrix();
        MachineClient.ClientCamera.updateMatrixWorld();
    }


    if (raftId === playerId && !playerData.captainTag) {
        // for each cap added add its own cap tag

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Text style
        ctx.fillStyle = 'white';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Captain', canvas.width / 2, canvas.height * 0.6);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const newSpriteCapTag = new THREE.Sprite(new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            opacity: 0.2,
        }));

        newSpriteCapTag.scale.set(2, 0.5, 1);
        newSpriteCapTag.position.set(0, 1.6, 0);
        newSpriteCapTag.renderOrder = 4;

        playerData.obj.add(newSpriteCapTag);
        playerData.captainTag = newSpriteCapTag;
    }
}


function RemoveCaptainTag(playerId) {
    const playerData = MachineClient.ClientStoredPlayers[playerId];
    if (!playerData) return;

    if (playerData.captainTag) {
        playerData.obj.remove(playerData.captainTag);
        playerData.captainTag.material.map.dispose();
        playerData.captainTag.material.dispose();
        playerData.captainTag.geometry.dispose();
        delete playerData.captainTag;
    }
}

socket.on('RemovePlayerFromFleet', (playerid, fleetid, islandN) => {
    RemovePlayerFromRaft(playerid, fleetid, islandN)
})

socket.on('FleetDockDepart', (Obj) => {
    const { fleetid, actiondock } = Obj;
    SetFleetTransparency(fleetid, actiondock);
})

function RemovePlayerFromRaft(playerId, TarRaftId, islandN) {
    const playerData = MachineClient.ClientStoredPlayers[playerId];
    if (!playerData) {
        console.warn(`${playerId} not found`);
        return;
    }

    const raftData = MachineClient.ClientStoredRafts[TarRaftId];
    if (raftData && raftData.obj) {
        raftData.obj.remove(playerData.obj);
        MachineClient.GlobalDefineWorld.add(playerData.obj);

        if (playerId === MachineClient.ClientNetPeer.id) {
            raftData.obj.remove(MachineClient.ClientCamera);
            MachineClient.ClientDocked = true;
            ThrowWelcomeIsland(String(islandN));
        }

    }
}



function RemovePlayer(id) {
    const MemoryTargetPlayer = MachineClient.ClientStoredPlayers[id];
    if (!MemoryTargetPlayer) return;

    if (MemoryTargetPlayer.fishing === true) {
        PullRope(MemoryTargetPlayer.ObjectID);
    }

    MachineClient.GlobalDefineWorld.remove(MemoryTargetPlayer.obj);

    MemoryTargetPlayer.obj.traverse((child) => {
        if (child.isMesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.dispose());
            } else {
                child.material.dispose();
            }
        }
    });

    delete MachineClient.ClientStoredPlayers[id];
}

MachineClient.ClientNetPeer.on('EquipGun', data => {
    EquipGun(data);
});

MachineClient.ClientNetPeer.on('DeleteGun', data => {
    DeleteGun(data);
});

MachineClient.ClientNetPeer.on('EquipRod', data => {
    EquipRod(data);
});

MachineClient.ClientNetPeer.on('DeleteRod', data => {
    DeleteRod(data);
});

socket.on('EquipCannon', (d) => {
    EquipCannon(d)
})

socket.on('DeleteCannon', (d) => {
    DeleteCannon(d)
})


socket.on('gs_data', (o) => {
    const TotalFleets = o.fleets;
    const TotalPlayers = o.players;
    document.getElementsByClassName('active-fleets')[0].innerHTML = TotalFleets + ' Active Fleets';

    if (MachineClient.ClientMenu === true) {
        // document.getElementsByClassName('val-m-users')[0].innerHTML = TotalPlayers + ' ' + '/ ' + '125'
        ThrowPing();
    }
})

socket.on('UValues', (o) => {
    const { gold, wood } = o;

    if (wood) {
        document.getElementsByClassName('vw value')[0].innerHTML = ValueFormatter(Number(wood));
    };

    if (gold) {
        document.getElementsByClassName('vg value')[0].innerHTML = ValueFormatter(Number(gold));
    };
});

SetupLeaderboardClass(socket);



socket.on('throw_rod', (data) => {
    const { PlayerID, StartPos, direction } = data;
    MachineClient.ClientStoredPlayers[PlayerID].fishing = true;
    ThrowRod(PlayerID, new THREE.Vector3(StartPos.x, StartPos.y, StartPos.z), new THREE.Vector3(direction.x, direction.y, direction.z));
});

socket.on('PullRope', (i) => {
    MachineClient.ClientStoredPlayers[i].fishing = false;
    PullRope(i);
})

socket.on('update_ship_health', (o) => {
    const { fleetid, health, maxhealth } = o;

    UpdateFleetHealth(fleetid, health, maxhealth)

})

socket.on('fishreward', (pid) => {
    FishOutCube(pid)
})
export function UpdateFleetHealth(fleetId, newHP, maxHP) {
    const fleetData = MachineClient.ClientStoredRafts[fleetId];
    if (!fleetData) return console.warn(`Fleet ${fleetId} not found`);

    // Round HP values to integers
    const displayHP = Math.floor(newHP);
    const displayMaxHP = Math.floor(maxHP);

    // The health sprite is added at y = 18 in CreateFleet
    const hpSprite = fleetData.obj.children.find(
        c => c.type === 'Sprite' && c.material?.map && Math.abs(c.position.y - 18) < 0.1
    );

    if (fleetId === MachineClient.ClientStoredShipID) {
        document.getElementById('ship-health-text').textContent = `${displayHP}/${displayMaxHP}`
    }

    if (!hpSprite) return console.warn(`Health sprite for fleet ${fleetId} not found`);

    const hpCanvas = hpSprite.material.map.image;
    const hpCtx = hpCanvas.getContext('2d');
    const width = hpCanvas.width;
    const height = hpCanvas.height;

    // Clear previous content
    hpCtx.clearRect(0, 0, width, height);

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
    }

    const bgGradient = hpCtx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#ffffff');
    bgGradient.addColorStop(1, '#e0e0e0');
    hpCtx.fillStyle = bgGradient;
    roundRect(hpCtx, 0, 0, width, height, 8);

    const hpPercent = Math.max(0, Math.min(newHP / maxHP, 1));
    const hpGradient = hpCtx.createLinearGradient(0, 0, 0, height);
    hpGradient.addColorStop(0, '#00bfff');
    hpGradient.addColorStop(1, '#0077b3');
    hpCtx.fillStyle = hpGradient;
    roundRect(hpCtx, 0, 0, width * hpPercent, height, 8);

    hpCtx.font = 'bold 24px Verdana';
    hpCtx.fillStyle = '#f8f8f8ff';
    hpCtx.textAlign = 'center';
    hpCtx.textBaseline = 'top';
    hpCtx.fillText(`${displayHP}/${displayMaxHP} HP`, width / 2, 4);

    hpSprite.material.map.needsUpdate = true;
}



socket.on('SpawnShark', (Object) => {
    const payload = Object.SharkPayload;
    SpawnShark({
        ObjectID: payload.ObjectID,
        ObjectData: {
            position: payload.ObjectData.position
        }
    })
})

socket.on('SharksTotals', (Sharks) => {
    for (const sharkID in Sharks) {
        const s = Sharks[sharkID];

        SpawnShark({
            ObjectID: sharkID,
            ObjectData: {
                position: s.ObjectData.position
            },
            rotationY: s.ObjectData.rotY
        });
    }
});

socket.on('GenerateInviteURL', (key) => {
    MachineClient.ClientStoredInviteID = key;
});

socket.on('resp.chat.message', (data) => {
    const { sender, message, owner, params } = data;
    if (FreezeChat === true) return;
    CastMessage(sender, message, owner, params);
})
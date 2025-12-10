export const MachineClient = {
    GlobalDefineWorld: null,
    ClientStoredPlayers: {},
    ClientStoredRafts: {},
    ClientStoredSharks: {},
    ClientStoredBullets: [],
    ClientStoredClientID: null,
    ClientStoredCrates: {},
    ClientNetPeer: io('localhost', { // edit address later on & connect MachineClient.ClientNetPeer
        autoConnect: false,
        transports: ['websocket', 'polling']
    }),
    ClientMenu: true,
    ClientCamera: null,
    ClientMapUpdate: 0,
    ClientRenderer: null,
    ClientDocked: false,
    ClientIslands: [],
    ClientPingTime: 0,
    ActiveFishingHooks: [],
    FogBoundary: null,
    DepartIndicators: new Map(),
    ActiveSplashes: [],
    ClientStoredPumps: [],
    ClientStoredShipID: null,
    ClientStoredInviteID: null
}

export const UpdateStates = {
    CompassUpdate: 0,
    MinimapUpdate: 0
}

export const ServerTempCache = {
    Ships: {}
}
const { Players, Fleets } = require("./ServerStoring.js");
const { HostableRooms } = require('./ServerStoring.js');
const { ConfigCache } = require('./ConfigLoader.js')

function ThrowServerSync(Engine) {
    setInterval(() => {
        // Only sync players that are connected (bug fix)
        const connectedPlayers = Object.values(Players).filter(player => player.ObjectGame.connected !== false);
        
        Engine.to(HostableRooms.pvp.key).emit('SyncObjectStates', connectedPlayers, Object.values(Fleets));
    }, ConfigCache.Server.SyncSpeed * 1000);

    if (ConfigCache.Server.Debug)
        console.log(null, 'Server Sync Started.');
}

module.exports = {
    ThrowServerSync
};
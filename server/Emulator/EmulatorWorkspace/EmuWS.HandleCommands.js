const { ConfigCache } = require('../../ConfigLoader');
const { ServerExtraData, Players, Sharks, Fleets } = require('../../ServerStoring');

function EmuHookMsgHandler(io, peer, payload) {
    const { message, sender } = payload;
    const CommandPin = ConfigCache.Server.CommandPin;

    if (!message || typeof message !== 'string') {
        return { handled: false, feedback: 'Invalid message format.' };
    }

    if (message.startsWith(CommandPin)) {
        const parts = message.slice(CommandPin.length).trim().split(/\s+/);
        const command = parts.shift().toLowerCase(); // command name
        const arg1 = parts[0]; // first user arg

        // CMD: help
        if (command === 'help') {
            const i = [
                'Available Commands [cut]',
                `${CommandPin}help - show this help menu [cut]`,
                `${CommandPin}guide - get a beginner's guide [cut]`,
                `${CommandPin}server - get server information [cut]`,
                `${CommandPin}fov 75 - set your camera FOV`
            ].join('\n');

            const ParamsData = { ac_freeze_chat: 3000 };

            io.to(peer.id).emit('resp.chat.message', {
                sender: 'Server',
                message: i,
                owner: 'server'
            });
            io.to(peer.id).emit('resp.chat.message', {
                sender: 'Server',
                message: `Chat is freezed for ${ParamsData.ac_freeze_chat / 1000} seconds.`,
                owner: 'server',
                params: { freeze_chat: ParamsData.ac_freeze_chat }
            });
            return { handled: true };
        }

        // CMD: guide
        if (command === 'guide') {
            const Guide = [
                "📝 Beginner's Tutorial: [cut] Welcome to the game. Your first goal is to survive in a world full of enemies and wild animals. Keep moving, stay aware, and avoid getting caught by sharks or hostile players.",
                "Use WASD or arrow keys to move around, and your mouse to look and aim. Always pay attention to your surroundings — staying still can make you an easy target.",
                "Explore islands to find loot, resources, and safe spots. Islands are key for upgrading your ship, weapons, and gear, so plan your routes carefully and avoid dangerous areas in between. [cut]",
                "Combat basics: Use your mouse to aim and click to shoot. Switch weapons or tools with number keys 1, 2, 3, 4, 5 depending on what you have equipped. Timing and positioning are important for both attacking and defending.",
                "Always watch your health and avoid unnecessary fights early on. Collect resources, upgrade your equipment, and prepare for tougher encounters as you progress.",
                "Work with other players if you want, but be careful — alliances can break. Your main goal is survival, exploration, and improving your gear. Have fun and good luck! [cut]"
            ].join('\n');

            const ParamsData = { ac_freeze_chat: 10000 };

            io.to(peer.id).emit('resp.chat.message', {
                sender: 'Server',
                message: Guide,
                owner: 'server'
            });
            io.to(peer.id).emit('resp.chat.message', {
                sender: 'Server',
                message: `Chat is freezed for ${ParamsData.ac_freeze_chat / 1000} seconds.`,
                owner: 'server',
                params: { freeze_chat: ParamsData.ac_freeze_chat }
            });
            return { handled: true };
        }

        // CMD: server
        if (command === 'server') {
            const counts_shark = Object.keys(Sharks).length;
            const counts_fleet = Object.keys(Fleets).length;
            const counts_player = Object.keys(Players).length;

            const CalcSeconds = Math.floor((Date.now() - ServerExtraData.BootTime) / 1000);
            const days = Math.floor(CalcSeconds / 86400);
            const hours = Math.floor((CalcSeconds % 86400) / 3600);
            const minutes = Math.floor((CalcSeconds % 3600) / 60);
            const seconds = CalcSeconds % 60;

            const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

            const ServerInfo = [
                `Server Info: [cut]`,
                `- Sharks: ${counts_shark}/20 [cut]`,
                `- Fleets: ${counts_fleet}/∞ [cut]`,
                `- Players: ${counts_player}/${ConfigCache.Server.MaxConnections} [cut]`,
                `- Uptime: ${uptime}`
            ].join('\n');

            io.to(peer.id).emit('resp.chat.message', {
                sender: 'Server',
                message: ServerInfo,
                owner: 'server'
            });

            return { handled: true };
        }

        // CMD: fov <number>
        if (command === 'fov') {
            if (!arg1) {
                io.to(peer.id).emit('resp.chat.message', {
                    sender: 'Server',
                    message: `Usage: ${CommandPin}fov <number>`,
                    owner: 'server'
                });
                return { handled: true };
            }

            const FovValue = parseFloat(arg1);
            
            if (isNaN(FovValue) || FovValue < 30 || FovValue > 100) {
                io.to(peer.id).emit('resp.chat.message', {
                    sender: 'Server',
                    message: 'Please enter a valid FOV value between 30 and 100.',
                    owner: 'server'
                });
                return { handled: true };
            }

            io.to(peer.id).emit('resp.chat.message', {
                sender: 'Server',
                message: `Your FOV has been set to ${FovValue}.`,
                owner: 'server',
                params: { set_fov: FovValue }
            });

            return { handled: true };
        }

        return { handled: true, feedback: 'Command not recognized or invalid.' };
    }

    return { handled: false };
}

module.exports = {
    EmuHookMsgHandler
};
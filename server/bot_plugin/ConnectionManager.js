const { io } = require("socket.io-client");

const debugprod = false;
const BOT_COUNT = 0;
const bots = [];

function cb(botIndex) {
    const socket = io("http://localhost:80", {
        reconnection: false
    });

    socket.on("connect", () => {
        if (debugprod) console.log(`Bot ${botIndex} connected with id: ${socket.id}`);
        socket.emit("auth", "");
    });

    socket.on("auth_ok", () => {
        if (debugprod) console.log(`Bot ${botIndex} auth OK, starting play.`);
        socket.emit("play", {});
    });

    socket.on("disconnect", (reason) => {
        if (debugprod) console.log(`${reason}`);
        setTimeout(() => {
            if (debugprod) console.log(`reconnecting...`);
            cb(botIndex);
        }, 1000);
    });

    socket.on("connect_error", (err) => {
        if (debugprod) console.log(`${err.message}`);
        setTimeout(() => cb(botIndex), 1000);
    });

    return socket;
}

for (let i = 0; i < BOT_COUNT; i++) {
    setTimeout(() => {
        bots.push(cb(i));
    }, i * 50);
}

module.exports = bots;
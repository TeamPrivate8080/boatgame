const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ path: './config.env' });
const { HandleConnection } = require('./server/HandleConnectionStates.js');
const { EngineTicker } = require('./server/TickEngine.js');
const app = express();
const PORT = 80;
const server = http.createServer(app);
const { ThrowServerSync } = require('./server/SyncConHandler.js');
const { EnginePacketHandler } = require('./server/PacketHandler.js');
const { StartGLoop } = require('./server/GeneralLoop.js');
const { ConfigCache } = require('./server/ConfigLoader.js')
const { EmulatorOnBoot } = require('./server/Emulator/EmuOnLoad.js');
const cors = require("cors");
require('./server/imports.js');

const io = new Server(server, {
  maxHttpBufferSize: 30000,
  cors: {
    origin: ["shipz.nl", "www.shipz.nl", "localhost"],
    methods: ["GET", "POST"]
  },
  allowEIO3: true
});

app.use(cors({
  origin: "shipz.nl",
  methods: ["GET", "POST"],
  allowedHeaders: "*"
}));

if (ConfigCache.Server.ServeHTTP) {
  app.use((req, res, next) => {
    const AllowedHosts = ['shipz.nl', 'www.shipz.nl', 'localhost'];
    const host = req.headers.host?.split(':')[0];

    if (!AllowedHosts.includes(host)) {
      return res.status(403).send('Access denied');
    }

    next();
  });

  app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
      if (/\.(png|jpe?g|gif|mtl|obj)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      }
    }
  }));
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  if (io.engine.clientsCount > ConfigCache.Server.MaxConnections) {
    socket.disconnect(0);
    return;
  }

  HandleConnection(socket, io);
  EnginePacketHandler(socket, io)
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  EngineTicker(io);
  ThrowServerSync(io);
  StartGLoop(io);
  EmulatorOnBoot(io);
});
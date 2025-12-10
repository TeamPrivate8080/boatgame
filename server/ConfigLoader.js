const ConfigCache = {
    Players: {
        StartMoney: process.env.StartMoney,
        StartShip: process.env.StartShip
    },
    Server: {
        MaxConnections: process.env.MaxConnections,
        Debug: process.env.Debug === 'true',
        ServeHTTP: process.env.ServeHTTP === 'true',
        SyncSpeed: process.env.SyncSpeed,
        CommandPin: process.env.CommandPin
    }
}

module.exports = {
    ConfigCache
}

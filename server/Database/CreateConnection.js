const { Players, Fleets } = require('../ServerStoring');
const mysql = require('mysql2');
const process = require('process');

const DB_HOST = '92.118.206.229';
const DB_PORT = 3306;
const DB_NAME = '0';
const DB_USER = '0';
const DB_PASS = '0';

// server registering 
const ThisServer = {
  addr: 'dedicated.shipz.nl',
  port: 443,
  loc: 'Survival'
};

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error(err.message);
    return;
  }
  console.log('Database connected - ', DB_NAME);
  connection.release();

  RegisterServerPool();
  StartStatsUpdater();
});

function RegisterServerPool() {
  const sql = `
    INSERT INTO active_servers (address, port, location, online_users, sailing_fleets, last_heartbeat)
    VALUES (?, ?, ?, 0, 0, CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE last_heartbeat = CURRENT_TIMESTAMP
  `;
  pool.query(sql, [ThisServer.addr, ThisServer.port, ThisServer.loc], (err) => {
    if (err) console.error(err.message);
    else console.log(`Registered server ${ThisServer.addr}:${ThisServer.port}`);
  });
}

function RemoveServerPool() {
  const sql = `DELETE FROM active_servers WHERE address = ? AND port = ?`;
  pool.query(sql, [ThisServer.addr, ThisServer.port], (err) => {
    if (err) console.error(err.message);
    else console.log(`Deregistered server ${ThisServer.addr}:${ThisServer.port}`);
    process.exit(0);
  });
}

function StartStatsUpdater() {
  setInterval(() => {
    try {
      const Users = Object.keys(Players).length;
      const TotFleets = Object.keys(Fleets).length;

      const sql = `
        UPDATE active_servers
        SET online_users = ?, sailing_fleets = ?, last_heartbeat = CURRENT_TIMESTAMP
        WHERE address = ? AND port = ?
      `;

      pool.query(sql, [Users, TotFleets, ThisServer.addr, ThisServer.port], (err) => {
        if (err) console.error('⚠️ Failed to update server stats:', err.message);
      });
    } catch (err) {
      console.error('⚠️ Error while updating stats:', err);
    }
  }, 15000);
}

process.on('SIGINT', RemoveServerPool);
process.on('SIGTERM', RemoveServerPool);
process.on('exit', RemoveServerPool);
process.on('uncaughtException', (e) => {
  console.error(e);
  RemoveServerPool();
});

module.exports = pool;
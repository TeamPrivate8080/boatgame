const { Players } = require('../ServerStoring');
const pool = require('./CreateConnection');

function DBHandleAuth(Engine, Peer, token) {
    if (!Players[Peer.id]) return;

    // misformed token
    if (!token || typeof token !== 'string' || token.length < 4) {
        const guest = 'Guest_' + Math.floor(100000 + Math.random() * 900000);
        Players[Peer.id].ObjectDBID = guest;
        Players[Peer.id].ObjectName = guest;
        Players[Peer.id].ObjectGame.rank = 'Guest';
        Players[Peer.id].ObjectGame.clan = '';
        Players[Peer.id].ObjectGame.auth = true;
        Peer.emit('auth_ok');
        return;
    }

    pool.query(
        'SELECT id, username, level FROM users WHERE auth_ticket = ? LIMIT 1',
        [token],
        (err, results) => {
            // no user found in db
            if (err || results.length === 0) {
                if(!Players[Peer.id]) return;
                const guest = 'Guest_' + Math.floor(100000 + Math.random() * 900000);
                Players[Peer.id].ObjectDBID = guest;
                Players[Peer.id].ObjectName = guest;
                Players[Peer.id].ObjectGame.rank = 'Guest';
                Players[Peer.id].ObjectGame.clan = '';
                Players[Peer.id].ObjectGame.auth = true;
                Peer.emit('auth_ok');
                return;
            }

            // Allowed > Update user auth & details
            const user = results[0];

            pool.query(
                `SELECT c.name AS clan_name
                 FROM clan_members cm
                 JOIN clans c ON c.id = cm.clan_id
                 WHERE cm.user_id = ? LIMIT 1`,
                [user.id],
                (err2, clanResults) => {
                    let ClanName = (!err2 && clanResults.length > 0)
                        ? clanResults[0].clan_name
                        : '';

                    Players[Peer.id].ObjectDBID = user.id;
                    Players[Peer.id].ObjectName = user.username;
                    Players[Peer.id].ObjectGame.rank = 'Level ' + user.level;
                    Players[Peer.id].ObjectGame.clan = ClanName;
                    Players[Peer.id].ObjectGame.auth = true;
                    Players[Peer.id].ObjectGame.account = true;

                    pool.query(
                        'UPDATE users SET online = 1 WHERE id = ?',
                        [user.id],
                        (err3) => {
                            if (err3) console.error(`Failed to set user ${user.id} online `, err3);
                        }
                    );

                    Peer.emit('auth_ok');
                }
            );
        }
    );
}

module.exports = {
    DBHandleAuth
};
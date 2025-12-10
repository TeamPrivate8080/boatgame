const pool = require('./CreateConnection');
const { Players } = require('../ServerStoring');

setInterval(() => {
    for (const id in Players) {
        const player = Players[id];
        if (!player || !player.ObjectGame || !player.ObjectGame.account) continue;

        const userId = player.ObjectDBID;
        const gained = player.GainedValues;
        if (!userId || !gained) continue;

        const gainedXp = Number(gained.xp || 0);
        const gainedKills = Number(gained.kills || 0);
        const gainedDeaths = Number(gained.deaths || 0);
        const currentGold = Number(player.ValueStates?.gold?.amount || 0);
        const currentKillstreak = Number(player.ObjectGame?.kills || 0);

        if (gainedXp === 0 && gainedKills === 0 && gainedDeaths === 0 && currentGold === 0 && currentKillstreak === 0)
            continue;

        pool.query(
            `SELECT highest_gold, killstreak FROM user_stats WHERE user_id = ? LIMIT 1`,
            [userId],
            (err, rows) => {
                if (err) {
                    console.error(`❌ DB read error for ${userId}:`, err);
                    return;
                }

                let dbHighestGold = rows.length > 0 ? Number(rows[0].highest_gold) : 0;
                let dbKillstreak = rows.length > 0 ? Number(rows[0].killstreak) : 0;

                let newHighestGold = dbHighestGold;
                let newHighestKillstreak = dbKillstreak;

                if (currentGold > dbHighestGold) newHighestGold = currentGold;
                if (currentKillstreak > dbKillstreak) newHighestKillstreak = currentKillstreak;

                pool.query(
                    `
                    UPDATE user_stats
                    SET
                        xp = xp + ?,
                        kills = kills + ?,
                        deaths = deaths + ?,
                        highest_gold = ?,
                        killstreak = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ?
                    `,
                    [gainedXp, gainedKills, gainedDeaths, newHighestGold, newHighestKillstreak, userId],
                    (err2, result) => {
                        if (err2) {
                            console.error(`❌ Failed to update stats for user ${userId}:`, err2);
                            return;
                        }

                        // insert fresh record
                        if (result.affectedRows === 0) {
                            pool.query(
                                `
                                INSERT INTO user_stats (user_id, xp, kills, deaths, highest_gold, killstreak)
                                VALUES (?, ?, ?, ?, ?, ?)
                                `,
                                [userId, gainedXp, gainedKills, gainedDeaths, currentGold, currentKillstreak],
                                (err3) => {
                                    if (err3) console.error(`❌ Failed to insert stats for ${userId}:`, err3);
                                    else console.log(`🆕 Created new stats record for ${userId}`);
                                }
                            );
                        }

                        // levels
                        pool.query(
                            `SELECT level, xp FROM user_stats WHERE user_id = ? LIMIT 1`,
                            [userId],
                            (err4, rows2) => {
                                if (err4 || rows2.length === 0) return;

                                let level = Number(rows2[0].level);
                                let xp = Number(rows2[0].xp);

                                let leveledUp = false;

                                // Continues leveling up while XP is enough
                                while (xp >= Math.floor(1000 * Math.pow(1.25, level - 1))) {
                                    xp -= Math.floor(1000 * Math.pow(1.25, level - 1));
                                    level++;
                                    leveledUp = true;
                                }

                                if (leveledUp) {
                                    pool.query(
                                        `UPDATE user_stats SET level = ?, xp = ? WHERE user_id = ?`,
                                        [level, xp, userId],
                                        (err5) => {
                                            if (err5) {
                                                console.error(`❌ Failed to update level for user ${userId}:`, err5);
                                            } else {
                                                console.log(`🔼 User ${userId} leveled UP to level ${level}!`);
                                            }
                                        }
                                    );
                                }
                            }
                        );

                        player.GainedValues = {
                            peakgold: { gold: { amount: 0 } },
                            xp: 0,
                            kills: 0,
                            deaths: 0
                        };
                    }
                );
            }
        );
    }
}, 15000);
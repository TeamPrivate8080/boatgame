const { Players, Fleets } = require("./ServerStoring");

function GetGameLeaderboardScores() {
    const TPlayers = Object.values(Players)
        .sort((a, b) => b.ValueStates.gold.amount - a.ValueStates.gold.amount)
        .slice(0, 10)
        .map((p, i) => ({
            rank: i + 1,
            name: p.ObjectName,
            gold: p.ValueStates.gold.amount,
            clan: p.ObjectGame?.clan || ''
        }));

    const TFleets = Object.values(Fleets)
        .map(f => {
            const members = Object.values(Players).filter(p => p.ObjectGame.groupid === f.ObjectID);
            const totalGold = members.reduce((sum, p) => sum + p.ValueStates.gold.amount, 0);
            const ownerName = Players[f.Owner]?.ObjectName || 'Unknown';
            return {
                fleetName: `${ownerName}'s fleet`,
                totalGold,
                members: members.map(p => p.ObjectName),
                clan: members.map(p => p.ObjectGame?.clan || '')
            };
        })
        .sort((a, b) => b.totalGold - a.totalGold)
        .slice(0, 10)
        .map((f, i) => ({
            rank: i + 1,
            FName: f.fleetName,
            TGold: f.totalGold,
            members: f.members,
            clan: f.clan
        }));

    return { TPlayers, TFleets };
}

module.exports = { GetGameLeaderboardScores };
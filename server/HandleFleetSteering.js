const { Fleets, ShopVehicles } = require('./ServerStoring');

function HandleSteering(player) {
    if (!player.ObjectGame || !player.ObjectGame.inship) return;
    const fleet = Fleets[player.ObjectGame.inship];
    if (!fleet || player.ObjectID !== fleet.Owner) return;

    const FleetType = fleet.ObjectGame.model;
    let SteerHitRad = 3;
    
    for (const key in ShopVehicles) {
        if (ShopVehicles[key].name === FleetType) {
            SteerHitRad = ShopVehicles[key].SteerHit || 3;
            break;
        }
    }

    if (player.ObjectData.position.z > SteerHitRad) {
        fleet.ObjectData.steer = 'left';
        fleet.ObjectData.lean = 'left'
    } else if (player.ObjectData.position.z < -SteerHitRad) {
        fleet.ObjectData.steer = 'right';
        fleet.ObjectData.lean = 'right'
    } else {
        fleet.ObjectData.steer = 'middle';
        fleet.ObjectData.lean = 'none'
    }
}

module.exports = {
    HandleSteering
};
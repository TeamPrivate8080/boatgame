const { Crates, Islands } = require('../../ServerStoring');

function EmulatorSpawnNewCrate(io) {
    let validPos = false;
    let x, z;

    while (!validPos) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 1000;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;

        validPos = true;

        for (const island of Islands) {
            const dx = x - island.pos.x;
            const dz = z - island.pos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 90) {
                validPos = false;
                break;
            }
        }
    }

    const crate = {
        id: `c${Math.random().toString(36).substr(2, 9)}`,
        x: x,
        y: -2.9,
        z: z,
        ry: Math.random() * Math.PI * 2
    };

    Crates.push(crate);

    io.emit('new_crate', crate);
}

module.exports = { EmulatorSpawnNewCrate };

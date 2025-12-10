const { Crates, Islands } = require('../../ServerStoring');

function ServerSpawnCrates(count) {
    for (let i = 0; i < count; i++) {
        let patchpos = false;
        let x, z;

        while (!patchpos) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 1000;
            x = Math.cos(angle) * radius;
            z = Math.sin(angle) * radius;

            patchpos = true;
            for (const island of Islands) {
                const dx = x - island.pos.x;
                const dz = z - island.pos.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < 90) {
                    patchpos = false;
                    break;
                }
            }
        }

        Crates.push({
            id: `c${Math.random().toString(36).substr(2, 9)}`,
            x: x,
            y: -2.9,
            z: z,
            ry: Math.random() * Math.PI * 2
        });
        
    }

}

module.exports = { ServerSpawnCrates };
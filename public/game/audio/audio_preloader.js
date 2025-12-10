const AudioFiles = {
    gun_1: './assets/audio/sniper.wav',
    blub: './assets/audio/blub.mp3',
    hit: './assets/audio/hit.wav',
    hitwood: './assets/audio/hitwood.wav',
    cannon_fire: './assets/audio/c3.wav'
};

export const SoundPool = {};
export const SoundPoolIndex = {};

export function PreloadAudio(poolSize = 8) {
    for (const name in AudioFiles) {
        SoundPool[name] = [];
        SoundPoolIndex[name] = 0;
        for (let i = 0; i < poolSize; i++) {
            const audio = new Audio(AudioFiles[name]);
            audio.preload = 'auto';
            SoundPool[name].push(audio);
        }
    }
}

PreloadAudio();
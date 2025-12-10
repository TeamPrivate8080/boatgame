import { SoundPool, SoundPoolIndex } from "./audio_preloader.js";

export function PlaySound(name, volume = 1) {
    const pool = SoundPool[name];
    if (!pool || pool.length === 0) return;

    const index = SoundPoolIndex[name];
    const audio = pool[index];

    SoundPoolIndex[name] = (index + 1) % pool.length;

    audio.currentTime = 0;
    audio.volume = Math.min(Math.max(volume, 0), 1);
    audio.play();
}
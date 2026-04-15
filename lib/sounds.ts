import { createAudioPlayer, type AudioPlayer, setAudioModeAsync } from 'expo-audio';

/**
 * Lightweight global sound effect manager.
 *
 * To enable a sound: drop a file into assets/sounds/ and uncomment its require()
 * in SOUND_SOURCES below. All sounds are optional — if the require is missing
 * the player just no-ops.
 *
 * Recommended free sources (CC0 / royalty free):
 *   - https://opengameart.org/art-search?keys=ui%20click
 *   - https://freesound.org (filter by CC0 license)
 *   - https://kenney.nl/assets/category:Audio  ← bundled UI/game sound packs
 *
 * Suggested files (drop in assets/sounds/):
 *   correct.mp3   ← short cheerful "ding" or chime (~0.4s)
 *   wrong.mp3     ← gentle thud or low buzz, NOT scary (~0.3s)
 *   perfect.mp3   ← celebratory win sound (~1s)
 *   tap.mp3       ← soft click for option presses (~0.1s)
 */

type SoundKey = 'correct' | 'wrong' | 'perfect' | 'tap';

// ─── Sound asset registry ───────────────────────────────────────────
// Uncomment after dropping the file into assets/sounds/
const SOUND_SOURCES: Record<SoundKey, number | null> = {
  correct: null, // require('@/assets/sounds/correct.mp3'),
  wrong:   null, // require('@/assets/sounds/wrong.mp3'),
  perfect: null, // require('@/assets/sounds/perfect.mp3'),
  tap:     null, // require('@/assets/sounds/tap.mp3'),
};

// ─── Internal cache of preloaded players ────────────────────────────
const players: Partial<Record<SoundKey, AudioPlayer>> = {};
let initialized = false;
let muted = false;

async function init() {
  if (initialized) return;
  initialized = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });
  } catch {
    // Audio mode might not be configurable in some environments — fail silently.
  }
  for (const key of Object.keys(SOUND_SOURCES) as SoundKey[]) {
    const src = SOUND_SOURCES[key];
    if (!src) continue;
    try {
      players[key] = createAudioPlayer(src);
    } catch (e) {
      // Asset missing or unsupported — skip.
    }
  }
}

export async function preloadSounds() {
  await init();
}

export async function playSound(key: SoundKey) {
  if (muted) return;
  if (!initialized) await init();
  const p = players[key];
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch {
    // Don't let audio failures ever crash a quiz.
  }
}

export function setMuted(value: boolean) {
  muted = value;
  if (value) {
    for (const p of Object.values(players)) {
      try { p?.pause(); } catch {}
    }
  }
}

export function isMuted() {
  return muted;
}

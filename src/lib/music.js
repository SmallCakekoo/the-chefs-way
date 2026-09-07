/* Música de fondo, volumen bajito. Dos pistas que se alternan.
   - setMusicEnabled(bool)  ← settings.music
   - setMusicVolume(0..1)    ← settings.musicVolume (se escala por MAX)
   - armMusic()              ← primer gesto del usuario (autoplay policy) */

const TRACKS = [
  encodeURI("/Kitchen Chaos Arcade.mp3"),
  encodeURI("/Kitchen Game Show.mp3"),
];
const MAX_VOL = 0.07; // techo real: música siempre discreta
let userVol = 0.6; // 0..1 del slider

let audio = null;
let enabled = true;
let armed = false;
let idx = Math.floor(Math.random() * TRACKS.length);

function realVol() {
  return Math.max(0, Math.min(1, userVol)) * MAX_VOL;
}

function ensure() {
  if (audio || typeof window === "undefined") return audio;
  audio = new Audio(TRACKS[idx]);
  audio.volume = realVol();
  audio.preload = "auto";
  audio.loop = false;
  audio.setAttribute("data-bg-music", "");
  audio.addEventListener("ended", () => {
    idx = (idx + 1) % TRACKS.length;
    audio.src = TRACKS[idx];
    if (enabled && armed) audio.play().catch(() => {});
  });
  return audio;
}

function apply() {
  const a = ensure();
  if (!a) return;
  a.volume = realVol();
  if (enabled && armed) {
    if (a.paused) a.play().catch(() => {});
  } else {
    a.pause();
  }
}

export function setMusicEnabled(v) {
  enabled = !!v;
  apply();
}

export function setMusicVolume(v) {
  userVol = typeof v === "number" ? v : 0.6;
  if (audio) audio.volume = realVol();
}

/** Llamar en el primer gesto del usuario (click/tap). */
export function armMusic() {
  if (armed) return;
  armed = true;
  apply();
}

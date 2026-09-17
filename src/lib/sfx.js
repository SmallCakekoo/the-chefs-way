/* Sonidos cortos sintetizados con WebAudio. Sin archivos.
   Se activa/desactiva con setSfxEnabled() (lo llama GameContext desde settings.sound). */

let enabled = true;
let hapticsOn = true;
let ctx = null;

export function setSfxEnabled(v) {
  enabled = !!v;
}
export function setHapticsEnabled(v) {
  hapticsOn = !!v;
}
function doVibrate(ms) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* no-op */
    }
  }
}
function buzz(ms) {
  if (hapticsOn) doVibrate(ms);
}

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function blip(freq, dur, type = "triangle", gain = 0.05, force = false) {
  if (!enabled && !force) return;
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  tap: () => {
    blip(420, 0.09, "triangle", 0.045);
    buzz(8);
  },
  press: () => {
    blip(300, 0.12, "square", 0.04);
    buzz(14);
  },
  select: () => {
    blip(560, 0.1, "triangle", 0.05);
    buzz(8);
  },
  back: () => {
    blip(240, 0.1, "sine", 0.04);
    buzz(6);
  },
  roll: () => {
    blip(180, 0.18, "sawtooth", 0.03);
    buzz([12, 40, 12, 40, 20]);
  },
  order: () => {
    blip(880, 0.14, "sine", 0.05);
    setTimeout(() => blip(1175, 0.22, "sine", 0.05), 120);
    buzz([30, 60, 30]);
  },
  // Aviso de pedido nuevo: SIEMPRE suena y vibra, aunque el jugador
  // tenga sonido/vibración en off. Es el evento más importante.
  orderAlert: () => {
    blip(784, 0.13, "sine", 0.06, true);
    setTimeout(() => blip(1046, 0.14, "sine", 0.06, true), 130);
    setTimeout(() => blip(1318, 0.24, "sine", 0.06, true), 260);
    doVibrate([40, 70, 40, 70, 90]);
  },
  win: () => {
    blip(523, 0.12, "triangle", 0.05);
    setTimeout(() => blip(659, 0.12, "triangle", 0.05), 90);
    setTimeout(() => blip(784, 0.18, "triangle", 0.05), 180);
    buzz([20, 40, 60]);
  },
  // Un pedido se vencio sin entregarse: le pega al restaurante.
  expire: () => {
    blip(320, 0.16, "sawtooth", 0.045);
    setTimeout(() => blip(220, 0.22, "sawtooth", 0.045), 110);
    buzz([25, 40]);
  },
};

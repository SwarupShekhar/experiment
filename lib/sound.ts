"use client";
let ctx: AudioContext | null = null;
let muted = false;
let hum: { o: OscillatorNode; o2: OscillatorNode; g: GainNode } | null = null;
if (typeof window !== "undefined") { try { muted = localStorage.getItem("b9_mute") === "1"; } catch {} }
export const isMuted = () => muted;
export function setMuted(m: boolean) { muted = m; try { localStorage.setItem("b9_mute", m ? "1" : "0"); } catch {} if (m) stopAmbient(); }
function ac() { if (!ctx && typeof window !== "undefined") { const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; if (C) ctx = new C(); } if (ctx?.state === "suspended") void ctx.resume(); return ctx; }
function tone(freq: number, dur: number, type: OscillatorType = "square", vol = 0.04, delay = 0) {
  if (muted) return; const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = freq;
  const t = c.currentTime + delay; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
}
/** Short vibration on phones that support it (Android). Silently ignored elsewhere. */
export function buzz(pattern: number | number[] = 12) { try { if (!muted) navigator.vibrate?.(pattern); } catch {} }
/** Fluorescent-light hum under the game. Very quiet. */
export function startAmbient() {
  if (muted || hum) return; const c = ac(); if (!c) return;
  const g = c.createGain(); g.gain.value = 0; const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 180;
  const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = 50;
  const o2 = c.createOscillator(); o2.type = "sine"; o2.frequency.value = 100;
  o.connect(f); o2.connect(f); f.connect(g).connect(c.destination); o.start(); o2.start();
  g.gain.linearRampToValueAtTime(0.012, c.currentTime + 2);
  hum = { o, o2, g };
}
export function stopAmbient() {
  if (!hum || !ctx) return; const h = hum; hum = null;
  h.g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5); setTimeout(() => { try { h.o.stop(); h.o2.stop(); } catch {} }, 600);
}
export const sfx = {
  click: () => tone(660, 0.05, "square", 0.025),
  confirm: () => { tone(520, 0.07); tone(780, 0.09, "square", 0.04, 0.07); buzz(10); },
  tick: () => tone(1200, 0.03, "sine", 0.02),
  alarm: () => { for (let i = 0; i < 3; i++) { tone(880, 0.12, "sawtooth", 0.03, i * 0.25); tone(660, 0.12, "sawtooth", 0.03, i * 0.25 + 0.12); } buzz([80, 60, 80, 60, 80]); },
  whistle: () => { tone(2200, 0.25, "sine", 0.03); tone(2400, 0.2, "sine", 0.03, 0.05); },
  thud: () => { tone(90, 0.25, "sine", 0.12); buzz(40); },
  reveal: () => { [220, 277, 330, 440].forEach((f, i) => tone(f, 0.6, "triangle", 0.035, i * 0.18)); buzz([30, 80, 30]); },
};

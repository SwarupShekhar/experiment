"use client";
let ctx: AudioContext | null = null;
let muted = false;
if (typeof window !== "undefined") { try { muted = localStorage.getItem("b9_mute") === "1"; } catch {} }
export const isMuted = () => muted;
export function setMuted(m: boolean) { muted = m; try { localStorage.setItem("b9_mute", m ? "1" : "0"); } catch {} }
function ac() { if (!ctx && typeof window !== "undefined") { const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; if (C) ctx = new C(); } return ctx; }
function tone(freq: number, dur: number, type: OscillatorType = "square", vol = 0.04, delay = 0) {
  if (muted) return; const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = freq;
  const t = c.currentTime + delay; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
}
export const sfx = {
  click: () => tone(660, 0.05, "square", 0.025),
  confirm: () => { tone(520, 0.07); tone(780, 0.09, "square", 0.04, 0.07); },
  tick: () => tone(1200, 0.03, "sine", 0.02),
  alarm: () => { for (let i = 0; i < 3; i++) { tone(880, 0.12, "sawtooth", 0.03, i * 0.25); tone(660, 0.12, "sawtooth", 0.03, i * 0.25 + 0.12); } },
  whistle: () => { tone(2200, 0.25, "sine", 0.03); tone(2400, 0.2, "sine", 0.03, 0.05); },
  thud: () => tone(90, 0.25, "sine", 0.12),
  reveal: () => { [220, 277, 330, 440].forEach((f, i) => tone(f, 0.6, "triangle", 0.035, i * 0.18)); },
};

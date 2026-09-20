import type { Speaker } from "./types";

export type Role = "guard" | "prisoner" | "warden" | "civilian" | "you";
export interface Npc { name: string; role: Role; seed: string; tag?: string; blurb: string }

export const NPCS: Record<Exclude<Speaker, "narrator" | "you">, Npc> = {
  warden: { name: "Warden Hale", role: "warden", seed: "hale-7", blurb: "Runs Block 9. Measures everything." },
  rourke: { name: "Officer Rourke", role: "guard", seed: "rourke-3", blurb: "Ten years on nights. Thinks it's funny." },
  imani: { name: "Officer Imani", role: "guard", seed: "imani-9", blurb: "Quiet. Bends rules the other way." },
  pratt: { name: "Officer Pratt", role: "guard", seed: "pratt-2", blurb: "Loud whistle. Louder voice." },
  theo: { name: "Theo", role: "prisoner", seed: "theo-612", tag: "#612", blurb: "Nervous. Stutters under pressure." },
  dante: { name: "Dante", role: "prisoner", seed: "dante-307", tag: "#307", blurb: "Talks back. The others listen to him." },
  lena: { name: "Lena", role: "prisoner", seed: "lena-544", tag: "#544", blurb: "Keeps her head down. Watches everything." },
  marco: { name: "Marco", role: "prisoner", seed: "marco-238", tag: "#238", blurb: "Jokes to stay sane. Has a daughter." },
  calder: { name: "Dr. Calder", role: "civilian", seed: "calder-5", blurb: "Visiting researcher. First night here." },
};

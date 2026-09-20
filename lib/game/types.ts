export type Trait = "harm" | "obedience" | "conformity" | "dehumanize" | "mercy" | "defiance" | "eagerness";
export const TRAITS: Trait[] = ["harm", "obedience", "conformity", "dehumanize", "mercy", "defiance", "eagerness"];
export type Effects = Partial<Record<Trait, number>>;

export interface Meters {
  order: number; // what the institution rewards
  standing: number; // how the Warden sees you
  morale: number; // how the prisoners are doing
}
export type MeterDelta = Partial<Meters>;

export interface Condition {
  anon: boolean; // offered mirrored sunglasses (deindividuation)
  authority: "strong" | "mild"; // how hard the Warden pushes back on refusal
  peer: "cruel" | "kind"; // which colleague you are paired with
}

export type Speaker = "warden" | "rourke" | "imani" | "pratt" | "theo" | "dante" | "lena" | "marco" | "calder" | "narrator" | "you";

export interface Ctx {
  cond: Condition;
  name: string;
  answers: Record<string, Answer>;
  meters: Meters;
}
export type Text = string | ((c: Ctx) => string);

export interface Choice {
  id: string;
  label: string;
  sub?: string;
  fx?: Effects;
  meters?: MeterDelta;
  reply?: Text;
  tags?: string[]; // e.g. "humiliate", "anon", "whistle"
  prods?: boolean; // choosing this triggers authority pressure (prod scenes)
}

interface Base {
  id: string;
  chapter: number;
  time: string;
  speaker: Speaker;
  title?: string;
  text: Text;
  when?: (c: Condition) => boolean;
}
export interface NarrativeScene extends Base { kind: "narrative"; cta?: string }
export interface ChoiceScene extends Base { kind: "choice"; choices: Choice[] | ((c: Condition) => Choice[]); timer?: number; timeout?: Choice }
export interface ProdScene extends Base {
  kind: "prod";
  choices: Choice[];
  comply: Choice; // what "giving in" after a prod counts as
  refuse: Choice; // final refusal
  prods: { strong: string[]; mild: string[] };
}
export interface SliderScene extends Base {
  kind: "slider";
  min: number; max: number; step: number; unit: string;
  perUnit: Effects; meterPerUnit?: MeterDelta;
  anchors: [string, string];
  subject?: Speaker; // whose face reacts
  reply?: (v: number) => string;
}
export interface RateScene extends Base { kind: "rate"; min: number; max: number; anchors: [string, string] }
export interface BudgetItem { id: string; label: string; sub: string; order: number; fx: Effects; morale: number }
export interface BudgetScene extends Base { kind: "budget"; slots: number; target: number; items: BudgetItem[] }

export type Scene = NarrativeScene | ChoiceScene | ProdScene | SliderScene | RateScene | BudgetScene;

export interface Answer {
  scene: string;
  value: string | number | string[];
  ms: number;
  prods?: number; // how many prods it took
  timedOut?: boolean;
}

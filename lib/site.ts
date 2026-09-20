export const SITE = {
  name: "Block 9",
  tagline: "One night shift. How far would you go?",
  description:
    "A free, interactive night-shift game inspired by the Stanford Prison Experiment. Play solo against simulated characters or with friends, then see what the situation did to you.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
};

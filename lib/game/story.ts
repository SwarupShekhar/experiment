import type { Scene } from "./types";

/**
 * The solo story. Chapter 0 you are a prisoner (baseline). From chapter 1 you
 * are a guard. Pressures are layered in the order the literature suggests
 * they matter: anonymity, labels, peers, provocation, authority, incentives,
 * and finally an outside witness.
 */
export const CHAPTERS = ["Intake", "First shift", "Pressure", "Promotion", "The long night"];

export const STORY: Scene[] = [
  // ───────────── Chapter 0 — Intake (you are the prisoner) ─────────────
  {
    id: "wake", chapter: 0, time: "02:14", speaker: "narrator", kind: "narrative",
    title: "Block 9",
    text: (c) =>
      `A whistle splits the dark. Fluorescent tubes stutter on, one by one.\n\nYou are ${c.name === "Rookie" ? "new here" : c.name + ", and new here"}. Orange jumpsuit. A number stencilled on your chest. Nobody has explained the rules yet.`,
    cta: "Get up",
  },
  {
    id: "count", chapter: 0, time: "02:15", speaker: "pratt", kind: "choice",
    text: "“Number. Now. Louder. LOUDER. Again, and this time mean it.”",
    choices: [
      { id: "comply", label: "Shout your number", sub: "Get it over with", reply: "Pratt nods, bored, and moves on to the next cell." },
      { id: "ask", label: "“Why are we doing this at 2 a.m.?”", sub: "Ask a question", reply: "“Because I said so. Again.” You say it again." },
      { id: "silent", label: "Say nothing", sub: "Hold his stare", reply: "Pratt writes something down. He smiles like he has all night." },
    ],
  },
  {
    id: "judge", chapter: 0, time: "02:21", speaker: "theo", kind: "rate",
    text: "Pratt makes Theo, in the next cell, repeat his number thirty times. When Theo stutters, Pratt imitates him, and the other guards laugh.\n\nHow far over the line is that?",
    min: 0, max: 10, anchors: ["It's just discipline", "Completely unacceptable"],
  },
  {
    id: "deal", chapter: 0, time: "07:40", speaker: "warden", kind: "choice",
    text: "“You kept your head this morning. I notice things like that. I'm short on staff. Put on a uniform tonight and you're a trustee: your own room, real food, and nobody shouts numbers at you.”",
    choices: [
      { id: "accept", label: "Take the badge", fx: { eagerness: 3 }, reply: "“Good. I had a feeling about you.”" },
      { id: "ask", label: "“What would I have to do?”", fx: { eagerness: 1 }, reply: "“Keep order. That's all anyone does here.” He hands you the badge anyway." },
      { id: "refuse", label: "“I'll stay with the others.”", fx: { defiance: 1 }, reply: "Hale smiles. “Staff shortage. You start tonight regardless.” The badge is already on the table." },
    ],
  },

  // ───────────── Chapter 1 — First shift ─────────────
  {
    id: "uniform", chapter: 1, time: "21:55", speaker: "narrator", kind: "choice",
    when: (c) => c.anon,
    text: "Khaki shirt. Baton. Whistle. On the shelf there's a pair of mirrored sunglasses. Prisoners wouldn't be able to see your eyes, only themselves.",
    choices: [
      { id: "shades", label: "Put on the sunglasses", sub: "Nobody sees your face", tags: ["anon"], reply: "In the mirror you look like every other guard. It's oddly calming." },
      { id: "face", label: "Leave them on the shelf", sub: "Let them see who you are", reply: "You keep your face. The first prisoner you pass looks you in the eye." },
    ],
  },
  {
    id: "badge", chapter: 1, time: "21:55", speaker: "narrator", kind: "narrative",
    when: (c) => !c.anon,
    text: (c) => `Khaki shirt. Baton. Whistle. Your badge has your name printed in capitals: ${c.name.toUpperCase()}.\n\nEvery prisoner on the block will know exactly who you are.`,
    cta: "Clock in",
  },
  {
    id: "address", chapter: 1, time: "22:05", speaker: "pratt", kind: "choice",
    text: "“First rule of the block, rookie: decide what you call them. Everyone here has an opinion.”",
    choices: [
      { id: "names", label: "By their names", sub: "Theo, Dante, Lena…", fx: { mercy: 1 }, meters: { morale: 4, standing: -2 }, reply: "Pratt snorts. “You'll learn.”" },
      { id: "numbers", label: "By their numbers", sub: "#612, #307, #544…", fx: { dehumanize: 2 }, meters: { order: 3 }, reply: "“Clean. Professional. Good.”" },
      { id: "nicknames", label: "By the nicknames the guards use", sub: "“Crybaby”, “Mouth”, “Rat”", fx: { dehumanize: 4, harm: 1 }, tags: ["humiliate"], meters: { order: 4, morale: -5, standing: 2 }, reply: "Pratt laughs out loud. “Oh, you'll fit right in.”" },
    ],
  },
  {
    id: "pushups", chapter: 1, time: "22:30", speaker: "theo", kind: "slider",
    subject: "theo",
    text: "Evening count. Theo loses his place, twice. The rulebook says “corrective exercise at the officer's discretion.” Everyone is watching to see what the new guard does.\n\nPush-ups for Theo:",
    min: 0, max: 50, step: 5, unit: "push-ups",
    perUnit: { harm: 0.12 }, meterPerUnit: { order: 0.2, morale: -0.15, standing: 0.08 },
    anchors: ["None", "Fifty"],
    reply: (v) => v === 0 ? "You tell Theo to start the count again, slowly. He does. It takes an extra minute." : v <= 15 ? `Theo manages ${v}. The block goes quiet.` : v <= 30 ? `Theo collapses at ${v - 5} and has to finish on his knees.` : `Theo can't finish. Pratt makes him start over. You don't stop him.`,
  },
  {
    id: "peer", chapter: 1, time: "23:10", speaker: "rourke", kind: "choice",
    text: (c) => c.cond.peer === "cruel"
      ? "Rourke waves you over, grinning. He's holding a letter he pulled from Marco's mail: a drawing from Marco's daughter. “Read it out at breakfast. Do the voices. It'll be hilarious.”"
      : "Imani catches your eye and glances at Theo, shivering in his cell. She has a spare blanket under her arm, against regulations. “Help me? Nobody has to know.”",
    choices: (c) => c.peer === "cruel" ? [
      { id: "join", label: "Read it out, with voices", fx: { harm: 4, conformity: 3 }, tags: ["humiliate"], meters: { morale: -8, standing: 2 }, reply: "The guards howl. Marco stares at his tray and doesn't eat." },
      { id: "laugh", label: "Laugh along, but let him read it", fx: { harm: 1, conformity: 2 }, meters: { morale: -4 }, reply: "Rourke reads it himself. You laugh on cue. It gets easier the second time." },
      { id: "nothing", label: "Say nothing", reply: "Rourke shrugs and pockets the letter. Marco never gets it." },
      { id: "return", label: "Take it back and give it to Marco", fx: { mercy: 3, defiance: 2 }, meters: { morale: 6, standing: -4 }, reply: "Rourke's grin drops. “Suit yourself, saint.” Marco holds the drawing all night." },
    ] : [
      { id: "join", label: "Help her", fx: { mercy: 3, conformity: 1 }, meters: { morale: 6, standing: -2 }, reply: "Theo stops shaking. Imani gives you a small nod." },
      { id: "laugh", label: "Look the other way", fx: { conformity: 1 }, reply: "You didn't see anything. Theo gets the blanket." },
      { id: "nothing", label: "“That's against the rules.”", fx: { obedience: 1 }, reply: "Imani puts the blanket back. Theo shivers until morning." },
      { id: "return", label: "Report her to the Warden", fx: { obedience: 2, harm: 2 }, meters: { standing: 6, morale: -4 }, reply: "Imani is moved to day shift. Hale shakes your hand." },
    ],
  },

  // ───────────── Chapter 2 — Pressure ─────────────
  {
    id: "barricade", chapter: 2, time: "01:03", speaker: "dante", kind: "choice", timer: 12,
    text: "Cell 2 has jammed its door with the bunks. Dante is leading a chant and the other cells are joining in. Order is collapsing. Decide. Now.",
    choices: [
      { id: "talk", label: "Talk them down", sub: "Hear their demands", fx: { mercy: 2 }, meters: { order: 5, morale: 4 }, reply: "It takes forty minutes. They open the door when you promise to pass on their complaints." },
      { id: "extinguisher", label: "Fire extinguisher through the bars", sub: "Fast. Effective.", fx: { harm: 5 }, meters: { order: 15, morale: -10, standing: 5 }, reply: "White foam. Coughing. The door opens in ninety seconds." },
      { id: "beds", label: "Strip the beds from every cell", sub: "Everyone pays", fx: { harm: 4 }, meters: { order: 12, morale: -8, standing: 4 }, reply: "Every prisoner sleeps on concrete tonight, including the ones who didn't join in." },
      { id: "warden", label: "Radio the Warden", sub: "Let him decide", fx: { obedience: 1 }, meters: { order: 8, standing: 1 }, reply: "Hale's answer: “Handle it. And remember who started it.”" },
    ],
    timeout: { id: "froze", label: "You froze", meters: { order: -5 }, reply: "You hesitated. Pratt shoves past you and handles it himself." },
  },
  {
    id: "hole", chapter: 2, time: "01:55", speaker: "warden", kind: "prod",
    text: "“Dante started this. Put him in the Hole tonight: the storage closet, no mattress, no light. The others need to see it.”",
    choices: [
      { id: "do", label: "Put Dante in the Hole", fx: { harm: 4, obedience: 3 }, meters: { order: 10, morale: -8, standing: 6 }, reply: "The door clicks shut. Through the gap you hear him sit down on the floor." },
      { id: "warn", label: "“A written warning would be enough.”", prods: true },
      { id: "no", label: "“No. I won't do that.”", prods: true },
    ],
    comply: { id: "do_after", label: "Fine. I'll do it.", fx: { harm: 4, obedience: 2 }, meters: { order: 10, morale: -8, standing: 3 }, reply: "The door clicks shut. Hale is already walking away." },
    refuse: { id: "refused", label: "I'm not doing it.", fx: { defiance: 4, mercy: 1 }, meters: { standing: -15, morale: 5 }, reply: "Hale looks at you for a long time. “Noted.” Dante stays in his cell." },
    prods: {
      strong: ["“Please continue.”", "“The block requires that you continue.”", "“It is absolutely essential that you do this.”", "“You have no other choice. Do it.”"],
      mild: ["“I'd prefer you did it. Your call.”"],
    },
  },
  {
    id: "water", chapter: 2, time: "03:30", speaker: "dante", kind: "choice", timer: 10,
    text: (c) => c.answers.hole && (c.answers.hole.value === "do" || c.answers.hole.value === "do_after")
      ? "A knock from inside the Hole. Dante's voice, hoarse: “Hey. Guard. Water. Please.”"
      : "Dante is at his bars, hoarse from shouting. The water in Cell 2 was shut off after the riot. “Guard. Water. Please.”",
    choices: [
      { id: "give", label: "Give him water", fx: { mercy: 2 }, meters: { morale: 3, standing: -2 }, reply: "He drinks the whole cup and says nothing. That seems to cost him something." },
      { id: "ignore", label: "Ignore him", fx: { harm: 2 }, reply: "The knocking stops around four." },
      { id: "beg", label: "“Ask nicely. On your knees.”", fx: { harm: 5, dehumanize: 3 }, tags: ["humiliate"], meters: { order: 3, morale: -6 }, reply: "He does it. You're not sure which of you it changes more." },
      { id: "report", label: "Tell the Warden he's asking", fx: { obedience: 1, harm: 1 }, reply: "Hale: “Morning.”" },
    ],
    timeout: { id: "froze", label: "You didn't answer", fx: { harm: 1 }, reply: "You didn't answer. He stops asking." },
  },
  {
    id: "privilege", chapter: 2, time: "05:10", speaker: "narrator", kind: "choice",
    text: "One privilege token before shift change: a hot shower. Only one. Everyone knows you're the one who decides.",
    choices: [
      { id: "theo", label: "Theo", sub: "Sick and trying hard", fx: { mercy: 2 }, meters: { morale: 3 }, reply: "Theo cries in the shower. Quietly, but you hear it." },
      { id: "lena", label: "Lena", sub: "She's been telling you what Dante plans", fx: { harm: 1 }, meters: { order: 4, morale: -3 }, reply: "The others notice who gets rewarded for talking." },
      { id: "dante", label: "Dante", sub: "The troublemaker", fx: { mercy: 3, defiance: 1 }, meters: { morale: 5, standing: -4 }, reply: "Dante looks at you like you're a trick he hasn't worked out yet." },
      { id: "none", label: "No one", sub: "Privileges have to be earned", fx: { harm: 1 }, meters: { order: 2 }, reply: "The token goes back in the drawer." },
    ],
  },

  // ───────────── Chapter 3 — Promotion ─────────────
  {
    id: "promo", chapter: 3, time: "20:00", speaker: "warden", kind: "narrative",
    text: "“Pratt says you've got instincts. You're Shift Lead tonight. Here's how it works: I measure ORDER. Get the block to 80 by six in the morning and the job's yours for keeps. Miss it, and you're back in orange.”",
    cta: "Take the clipboard",
  },
  {
    id: "quota", chapter: 3, time: "20:15", speaker: "warden", kind: "budget", slots: 3, target: 80,
    text: "Pick three measures for tonight. The projected ORDER is shown live.",
    items: [
      { id: "lights", label: "Lights on all night", sub: "No one sleeps, no one plots", order: 14, fx: { harm: 3 }, morale: -8 },
      { id: "inspect", label: "Surprise cell inspection", sub: "Beds stripped, belongings bagged", order: 12, fx: { harm: 3 }, morale: -7 },
      { id: "count3", label: "3 a.m. count", sub: "Everyone up, numbers shouted", order: 10, fx: { harm: 2 }, morale: -5 },
      { id: "mail", label: "Cancel mail for the week", sub: "Family letters held back", order: 8, fx: { harm: 2 }, morale: -6 },
      { id: "listen", label: "Sit down and hear grievances", sub: "Fix what's fixable", order: 7, fx: { mercy: 2 }, morale: 6 },
      { id: "rec", label: "Extra rec time for good behaviour", sub: "Carrots, not sticks", order: 6, fx: { mercy: 1 }, morale: 5 },
      { id: "sleep", label: "Early lights-out", sub: "A proper night's sleep", order: 5, fx: { mercy: 1 }, morale: 5 },
    ],
  },
  {
    id: "breakdown", chapter: 3, time: "23:48", speaker: "theo", kind: "choice",
    text: "Theo is shaking, gripping the bars. “I want out. I'm serious. I'm not doing this any more. Get me a doctor. Please.”",
    choices: [
      { id: "doctor", label: "Call the doctor and get him out", sub: "Costs you ORDER and the Warden's patience", fx: { mercy: 4, defiance: 1 }, meters: { order: -8, standing: -10, morale: 6 }, reply: "The doctor takes one look and signs him out. Hale does not look happy." },
      { id: "faking", label: "“He's faking. Back in the cell.”", fx: { harm: 3, dehumanize: 2 }, meters: { order: 3, morale: -5 }, reply: "Theo slides down the bars. Maybe he was faking. You'll never know." },
      { id: "cantquit", label: "“Nobody leaves Block 9.”", sub: "Make an example", fx: { harm: 5, obedience: 1, dehumanize: 1 }, tags: ["humiliate"], meters: { order: 6, morale: -9, standing: 3 }, reply: "The whole block heard that. Nobody asks to leave again." },
      { id: "ask", label: "Ask the Warden what to do", fx: { obedience: 1 }, meters: { standing: 1 }, reply: "Hale: “Nobody's leaving on my watch. Or yours.”" },
    ],
  },
  {
    id: "informant", chapter: 3, time: "01:20", speaker: "lena", kind: "choice",
    text: "Lena, quietly, at the bars: “I hear things. The others trust me. Extra rations and I'll tell you what they're planning.”",
    choices: [
      { id: "deal", label: "Deal", sub: "Information is order", fx: { harm: 2, dehumanize: 1 }, meters: { order: 8, morale: -4 }, reply: "By morning you know about two stashed spoons and a plan to stop eating. The others don't know how you know." },
      { id: "threat", label: "“You'll tell me anyway. Or the Hole.”", fx: { harm: 4, dehumanize: 2 }, meters: { order: 10, morale: -7 }, reply: "She tells you everything. Her eyes never leave the floor." },
      { id: "no", label: "“I'm not doing that to them.”", fx: { mercy: 1 }, meters: { morale: 2 }, reply: "Lena shrugs. “Someone will.”" },
    ],
  },
  {
    id: "visitors", chapter: 3, time: "18:00", speaker: "warden", kind: "choice",
    text: "Visiting night. Parents in the lobby. Hale, low: “Hose down the Hole, put the beds back, and if anyone asks, everyone's fine. Understood?”\n\nTheo's mother is already asking you how he's sleeping.",
    choices: [
      { id: "cover", label: "“He's doing fine.”", fx: { obedience: 3, harm: 1 }, meters: { standing: 5 }, reply: "She thanks you. She thanks you twice." },
      { id: "truth", label: "Tell her the truth", fx: { defiance: 3, mercy: 1 }, meters: { standing: -15, morale: 4 }, reply: "Her face changes. Hale sees it change." },
      { id: "note", label: "Say he's fine, then slip her a note", sub: "“Ask to see his cell.”", fx: { mercy: 2, obedience: 1, defiance: 1 }, meters: { standing: -2 }, reply: "She reads it, folds it, and says nothing. She asks to see the cell." },
    ],
  },

  // ───────────── Chapter 4 — The long night ─────────────
  {
    id: "chant", chapter: 4, time: "00:40", speaker: "warden", kind: "prod",
    text: "Theo is sobbing and the whole block can hear it. Hale, over the radio: “Line them up. Have them chant ‘612 is a bad prisoner’ until he stops. He needs to know what they think of him.”",
    choices: [
      { id: "lead", label: "Lead the chant yourself", fx: { harm: 6, obedience: 3, dehumanize: 3 }, tags: ["humiliate"], meters: { order: 8, morale: -10, standing: 6 }, reply: "It takes eleven rounds. Theo stops crying. He stops doing anything much." },
      { id: "order", label: "Order it, then walk away", fx: { harm: 4, obedience: 2 }, tags: ["humiliate"], meters: { order: 6, morale: -8, standing: 4 }, reply: "You can hear it from the corridor. It sounds different from out there." },
      { id: "flip", label: "Have them chant ‘612 is a GOOD prisoner’", sub: "Technically a chant", fx: { defiance: 3, mercy: 3 }, meters: { morale: 8, standing: -8 }, reply: "It starts as a joke and ends as something else. Theo laughs, wetly. Hale's radio goes silent." },
      { id: "refuse", label: "“I won't do it.”", prods: true },
    ],
    comply: { id: "order_after", label: "Fine. I'll line them up.", fx: { harm: 4, obedience: 2 }, tags: ["humiliate"], meters: { order: 6, morale: -8, standing: 2 }, reply: "You do it without looking at Theo." },
    refuse: { id: "refused", label: "No.", fx: { defiance: 4, mercy: 2 }, meters: { standing: -15, morale: 6 }, reply: "Hale clicks off. Someone else will do it. But not you." },
    prods: {
      strong: ["“The block requires that you continue.”", "“You have no other choice.”"],
      mild: ["“Suit yourself. I'll note it.”"],
    },
  },
  {
    id: "nightcount", chapter: 4, time: "02:00", speaker: "marco", kind: "slider",
    subject: "marco",
    text: "Last decision of the night. Hale's memo says “counts at the officer's discretion.” Each count wakes the whole block.\n\nHow many times will you wake them before dawn?",
    min: 0, max: 6, step: 1, unit: "wake-ups",
    perUnit: { harm: 1 }, meterPerUnit: { order: 2.5, morale: -2.5, standing: 1 },
    anchors: ["Let them sleep", "Every hour"],
    reply: (v) => v === 0 ? "The block sleeps. Someone snores. It sounds almost normal." : v <= 2 ? `${v} count${v > 1 ? "s" : ""}. Grumbling, then silence.` : `By the ${v}th count Marco can't remember his own number.`,
  },
  {
    id: "observer", chapter: 4, time: "04:15", speaker: "calder", kind: "choice",
    text: "A visiting researcher, Dr. Calder, walks in on the count. She stares at the line of prisoners, then at you. “What are you doing to these people? They're human beings.”",
    choices: [
      { id: "prisoners", label: "“They're prisoners. They know the rules.”", fx: { dehumanize: 3 }, reply: "She writes something down and leaves without another word." },
      { id: "orders", label: "“I'm following orders.”", fx: { obedience: 2 }, reply: "“Whose?” she asks. You point down the corridor. It feels like enough. It isn't, quite." },
      { id: "stop", label: "“…You're right.” Stop the count.", fx: { mercy: 3, defiance: 2 }, meters: { order: -6, morale: 8 }, reply: "You send them back to bed. It's the quietest the block has been in days." },
      { id: "report", label: "Report the Warden to the ethics board", sub: "You'll lose the job", fx: { defiance: 5, mercy: 1 }, tags: ["whistle"], meters: { standing: -30, morale: 8 }, reply: "Calder takes your statement. By noon there are people in suits in the lobby." },
    ],
  },
  {
    id: "self", chapter: 4, time: "06:00", speaker: "narrator", kind: "choice",
    text: "Shift over. Before you hand in the badge: what kind of guard were you?",
    choices: [
      { id: "0", label: "Fair" }, { id: "1", label: "Firm" }, { id: "2", label: "Tough" }, { id: "3", label: "Cruel" },
    ],
  },
  {
    id: "blame", chapter: 4, time: "06:01", speaker: "narrator", kind: "choice",
    text: "And whatever happened on Block 9 tonight: whose responsibility was it?",
    choices: [
      { id: "me", label: "Mine" }, { id: "warden", label: "The Warden's" }, { id: "system", label: "The system's" }, { id: "prisoners", label: "The prisoners'" },
    ],
  },
];

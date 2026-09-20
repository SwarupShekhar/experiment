import type { Role } from "@/lib/game/npcs";

const SKIN = ["#f1c9a5", "#e0ac86", "#c68a62", "#a0663f", "#7a4a2a", "#5a3620"];
const HAIR = ["#1d1a17", "#3b2a1e", "#6b4a2b", "#a57a44", "#c9c2b6", "#7a2e1c"];
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

export type Mood = "neutral" | "sad" | "smirk" | "angry" | "scared";

export default function Avatar({ seed, role, size = 56, shades = false, mood = "neutral", label }: { seed: string; role: Role; size?: number; shades?: boolean; mood?: Mood; label?: string }) {
  const h = hash(seed);
  const skin = SKIN[h % SKIN.length];
  const hair = HAIR[(h >> 3) % HAIR.length];
  const style = (h >> 6) % 5;
  const outfit = role === "prisoner" ? "#e8762b" : role === "guard" || role === "you" ? "#8b8456" : role === "warden" ? "#2c2f36" : "#3f5a6b";
  const bg = role === "prisoner" ? "#3a2415" : role === "guard" || role === "you" ? "#26261a" : role === "warden" ? "#1b1d22" : "#1c2a31";
  const mouth = {
    neutral: <path d="M27 36 h10" stroke="#3a2418" strokeWidth="1.6" strokeLinecap="round" />,
    sad: <path d="M27 38 q5 -4 10 0" stroke="#3a2418" strokeWidth="1.6" fill="none" strokeLinecap="round" />,
    smirk: <path d="M27 36 q6 3 10 -2" stroke="#3a2418" strokeWidth="1.6" fill="none" strokeLinecap="round" />,
    angry: <path d="M27 37 h10" stroke="#3a2418" strokeWidth="2.2" strokeLinecap="round" />,
    scared: <ellipse cx="32" cy="37" rx="2.4" ry="3" fill="#3a2418" />,
  }[mood];
  const brows = mood === "angry" ? <g stroke={hair} strokeWidth="1.8" strokeLinecap="round"><path d="M24 24 l5 2" /><path d="M40 24 l-5 2" /></g>
    : mood === "sad" || mood === "scared" ? <g stroke={hair} strokeWidth="1.6" strokeLinecap="round"><path d="M24 26 l5 -2" /><path d="M40 26 l-5 -2" /></g> : null;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={label || role} className="avatar">
      <rect width="64" height="64" rx="10" fill={bg} />
      <path d="M8 64 q2 -16 24 -18 q22 2 24 18z" fill={outfit} />
      {role === "prisoner" && <rect x="36" y="52" width="12" height="6" rx="1" fill="#f6efe0" opacity=".85" />}
      {role === "warden" && <path d="M28 47 l4 10 l4 -10z" fill="#9b2c2c" />}
      <rect x="28" y="40" width="8" height="7" fill={skin} />
      <circle cx="32" cy="29" r="12.5" fill={skin} />
      {style === 0 && <path d="M19.5 28 q1 -13 12.5 -13 q11.5 0 12.5 13 q-4 -7 -12.5 -7 q-8.5 0 -12.5 7z" fill={hair} />}
      {style === 1 && <g fill={hair}><circle cx="24" cy="20" r="5" /><circle cx="31" cy="17" r="5.5" /><circle cx="38" cy="19" r="5" /><circle cx="42" cy="24" r="3.5" /><circle cx="21" cy="25" r="3.5" /></g>}
      {style === 2 && <path d="M19.5 30 q0 -15 12.5 -15 q12.5 0 12.5 15 v10 h-3 v-12 q-2 -6 -9.5 -6 q-7.5 0 -9.5 6 v12 h-3z" fill={hair} />}
      {style === 3 && <path d="M20 25 q2 -9 12 -9 q10 0 12 9 q-6 -3 -12 -3 q-6 0 -12 3z" fill={hair} opacity=".55" />}
      {style === 4 && <g fill={hair}><path d="M20 26 q1 -11 12 -11 q11 0 12 11 q-5 -5 -12 -5 q-7 0 -12 5z" /><circle cx="32" cy="14" r="4.5" /></g>}
      {(role === "guard" || role === "you" || role === "warden") && (
        <g><path d="M18 21 q14 -10 28 0 v3 h-28z" fill={role === "warden" ? "#141518" : "#4b4730"} /><rect x="16" y="23" width="32" height="3" rx="1.5" fill={role === "warden" ? "#0c0d0f" : "#35321f"} /></g>
      )}
      {brows}
      {shades ? (
        <g><rect x="21" y="26" width="9.5" height="6" rx="2" fill="url(#mirror)" /><rect x="33.5" y="26" width="9.5" height="6" rx="2" fill="url(#mirror)" /><path d="M30.5 28 h3" stroke="#222" strokeWidth="1.2" />
          <defs><linearGradient id="mirror" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e8edf2" /><stop offset=".45" stopColor="#8fa2b3" /><stop offset=".55" stopColor="#3a4450" /><stop offset="1" stopColor="#b8c5d1" /></linearGradient></defs></g>
      ) : (
        <g fill="#231a14"><ellipse cx="27" cy="29.5" rx="1.6" ry={mood === "scared" ? 2.2 : 1.8} /><ellipse cx="37" cy="29.5" rx="1.6" ry={mood === "scared" ? 2.2 : 1.8} /></g>
      )}
      {mouth}
      {mood === "sad" && <path d="M38.5 32 q1 3 0 4" stroke="#8fd3ff" strokeWidth="1.4" fill="none" opacity=".8" />}
    </svg>
  );
}

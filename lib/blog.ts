import fs from "fs";
import path from "path";
import { marked } from "marked";

export interface Post { slug: string; title: string; description: string; date: string; dateLabel: string; minutes: number; html: string; tags: string[] }
const DIR = path.join(process.cwd(), "content/blog");

function parse(file: string): Post {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta: Record<string, string> = {};
  (m?.[1] || "").split("\n").forEach((l) => { const i = l.indexOf(":"); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"|"$/g, ""); });
  const body = m?.[2] || raw;
  const words = body.split(/\s+/).length;
  return {
    slug: file.replace(/\.md$/, ""), title: meta.title || file, description: meta.description || "", date: meta.date || "2026-01-01",
    dateLabel: new Date(meta.date || "2026-01-01").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    minutes: Math.max(1, Math.round(words / 220)), html: marked.parse(body, { async: false }) as string, tags: (meta.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
  };
}
export function getAllPosts(): Post[] {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR).filter((f) => f.endsWith(".md")).map(parse).sort((a, b) => (a.date < b.date ? 1 : -1));
}
export function getPost(slug: string): Post | null { return getAllPosts().find((p) => p.slug === slug) || null; }

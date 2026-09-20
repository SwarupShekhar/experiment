import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
export const metadata: Metadata = { title: "Blog: power, obedience and the psychology of prisons", description: "Plain-English writing on the Stanford Prison Experiment, Milgram, the BBC Prison Study and why ordinary people do harmful things.", alternates: { canonical: "/blog" } };
export default function Blog() {
  const posts = getAllPosts();
  return (
    <div className="blog">
      <p className="kicker">The Block 9 blog</p>
      <h1 className="display-2">Power, obedience, and what the studies really showed</h1>
      <div className="post-list">{posts.map((p) => <Link key={p.slug} href={`/blog/${p.slug}`} className="post-row"><small>{p.dateLabel} · {p.minutes} min read</small><h2>{p.title}</h2><p>{p.description}</p></Link>)}</div>
    </div>
  );
}

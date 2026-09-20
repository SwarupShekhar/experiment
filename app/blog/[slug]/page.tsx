import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPost } from "@/lib/blog";
import { SITE } from "@/lib/site";

export function generateStaticParams() { return getAllPosts().map((p) => ({ slug: p.slug })); }
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = getPost(params.slug); if (!p) return {};
  return { title: p.title, description: p.description, alternates: { canonical: `/blog/${p.slug}` }, openGraph: { type: "article", title: p.title, description: p.description, publishedTime: p.date } };
}
export default function PostPage({ params }: { params: { slug: string } }) {
  const p = getPost(params.slug); if (!p) notFound();
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.description, datePublished: p.date, publisher: { "@type": "Organization", name: SITE.name }, mainEntityOfPage: `${SITE.url}/blog/${p.slug}` };
  return (
    <article className="post">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <p className="kicker"><Link href="/blog">Blog</Link> · {p.dateLabel} · {p.minutes} min read</p>
      <h1 className="display-2">{p.title}</h1>
      <p className="lede">{p.description}</p>
      <div className="prose" dangerouslySetInnerHTML={{ __html: p.html }} />
      <div className="post-cta"><p>Think you&apos;d have been one of the good guards?</p><Link className="btn btn-big" href="/play">Take the night shift</Link></div>
    </article>
  );
}

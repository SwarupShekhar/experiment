import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getAllPosts } from "@/lib/blog";
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    ...["", "/play", "/party", "/stats", "/blog", "/about", "/privacy"].map((p) => ({ url: SITE.url + p, lastModified: now, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...getAllPosts().map((p) => ({ url: `${SITE.url}/blog/${p.slug}`, lastModified: new Date(p.date), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}

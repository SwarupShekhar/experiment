import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource/atkinson-hyperlegible/latin-400.css";
import "@fontsource/atkinson-hyperlegible/latin-700.css";
import "@fontsource/big-shoulders-display/latin-700";
import "@fontsource/big-shoulders-display/latin-900";
import "./globals.css";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} · ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { type: "website", siteName: SITE.name, title: `${SITE.name} · ${SITE.tagline}`, description: SITE.description, url: SITE.url },
  twitter: { card: "summary_large_image", title: `${SITE.name} · ${SITE.tagline}`, description: SITE.description },
  alternates: { canonical: "/" },
};
export const viewport: Viewport = { themeColor: "#101110", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-h">
          <Link href="/" className="logo" aria-label={`${SITE.name} home`}><span className="logo-bars" aria-hidden>|||</span>{SITE.name}</Link>
          <nav><Link href="/play">Solo</Link><Link href="/party">Party</Link><Link href="/stats">Results</Link><Link href="/blog">Blog</Link></nav>
        </header>
        <main>{children}</main>
        <footer className="site-f">
          <p>{SITE.name} is a free game inspired by the 1971 Stanford Prison Experiment. It is not a psychological assessment.</p>
          <p><Link href="/about">How it works</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/blog">Blog</Link></p>
        </footer>
      </body>
    </html>
  );
}

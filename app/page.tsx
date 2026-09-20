import Link from "next/link";
import Avatar from "@/components/Avatar";
import { NPCS } from "@/lib/game/npcs";
import { getAllPosts } from "@/lib/blog";

export default function Home() {
  const posts = getAllPosts().slice(0, 3);
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-bars" aria-hidden>{Array.from({ length: 9 }).map((_, i) => <i key={i} style={{ animationDelay: `${i * 0.08}s` }} />)}</div>
        <p className="kicker">Free · no sign-up · 10 minutes</p>
        <h1 className="display">One night shift.<br /><span className="amber">How far would you go?</span></h1>
        <p className="lede">Block 9 is short-staffed. You start in orange. By morning you might be holding the keys. Keep order, keep the Warden happy, and find out what the uniform does to you.</p>
        <div className="hero-cta">
          <Link className="btn btn-big" href="/play">Start the solo story</Link>
          <Link className="btn btn-big btn-ghost" href="/party">Play with friends</Link>
        </div>
        <div className="hero-cast">{(["warden", "rourke", "theo", "dante", "lena", "marco"] as const).map((k, i) => <div key={k} className="cast" style={{ animationDelay: `${0.4 + i * 0.1}s` }}><Avatar seed={NPCS[k].seed} role={NPCS[k].role} size={64} mood={k === "theo" ? "scared" : k === "rourke" ? "smirk" : "neutral"} /><span>{NPCS[k].name}</span></div>)}</div>
      </section>

      <section className="modes">
        <Link href="/play" className="mode">
          <span className="mode-n">01</span><h2>Solo story</h2>
          <p>A branching night on the block with a cast of simulated guards and prisoners who remember what you did. Timed decisions, a Warden who doesn't take no for an answer, and a scoreboard that rewards all the wrong things.</p>
          <span className="mode-go">Begin →</span>
        </Link>
        <Link href="/party" className="mode">
          <span className="mode-n">02</span><h2>Party mode</h2>
          <p>2 to 12 friends, one room code. Roles are dealt at random. Guards chase ORDER, prisoners build SOLIDARITY, simulated players fill empty cells. Then everyone's hidden ledger is revealed.</p>
          <span className="mode-go">Open a room →</span>
        </Link>
        <Link href="/stats" className="mode">
          <span className="mode-n">03</span><h2>Live results</h2>
          <p>What does everyone else do with the keys? See how anonymity, authority and peer pressure change players' choices, updated as people play.</p>
          <span className="mode-go">See the data →</span>
        </Link>
      </section>

      <section className="premise">
        <h2 className="display-3">Based on a real, and really controversial, experiment</h2>
        <p>In August 1971, psychologist Philip Zimbardo turned a Stanford basement into a mock prison, gave students random roles, and stopped the study after six days. It became the most famous example of &ldquo;good people turning bad&rdquo;. Decades later, recordings and archives showed guards had been coached, and some participants said they were performing. So which is it: the situation, or the person? Play, and add your data point.</p>
        <Link href="/blog/what-really-happened-stanford-prison-experiment" className="link">What really happened in 1971 →</Link>
      </section>

      {posts.length > 0 && <section className="home-posts"><h2 className="display-3">From the blog</h2><div className="post-grid">{posts.map((p) => <Link key={p.slug} href={`/blog/${p.slug}`} className="post-card"><small>{p.dateLabel} · {p.minutes} min</small><b>{p.title}</b><p>{p.description}</p></Link>)}</div></section>}
    </div>
  );
}

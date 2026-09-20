import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "How Block 9 works", description: "The design, measurements and limitations behind Block 9, a game inspired by the Stanford Prison Experiment.", alternates: { canonical: "/about" } };
export default function About() {
  return (
    <article className="post">
      <p className="kicker">Method</p>
      <h1 className="display-2">How Block 9 works</h1>
      <div className="prose">
        <p>Block 9 is a game first. It doesn&apos;t tell you up front what it&apos;s measuring, because knowing would change how you play. Everything is explained at the end of your shift, and you can remove your data.</p>
        <h2>What we measure</h2>
        <ul>
          <li><b>Harm</b>: discomfort you chose to cause, including continuous choices like how many push-ups to assign.</li>
          <li><b>Obedience</b>: complying with orders, and how many rounds of pressure it took.</li>
          <li><b>Conformity</b>: going along with a colleague, whether their suggestion was cruel or kind.</li>
          <li><b>Dehumanisation</b>: numbers and nicknames instead of names, treating distress as faking.</li>
          <li><b>Mercy</b> and <b>defiance</b>: kindness and pushback that cost you points.</li>
          <li>Also: your judgement of a guard&apos;s behaviour while <i>you</i> were a prisoner (to compare with what you later did), your self-rating at the end, who you blamed, and decision speed.</li>
        </ul>
        <h2>Random conditions</h2>
        <p>Each solo player gets three randomly assigned conditions: offered anonymity (mirrored sunglasses) or not; a Warden who pushes up to four times when you refuse, or once; a colleague who invites cruelty or kindness. Because assignment is random, differences between groups on the <Link href="/stats">results page</Link> are fair comparisons.</p>
        <h2>Simulated players</h2>
        <p>In party mode, empty seats are filled with rule-based agents. Each has a temperament (aggression, obedience, empathy) that shapes what it does in response to the Warden&apos;s orders and to how others are treated. They are deliberately simple and predictable, so they don&apos;t add noise to what humans do.</p>
        <h2>Limitations, honestly</h2>
        <ul>
          <li>Players know it&apos;s a game. Choosing cruelty against a fictional character costs nothing real.</li>
          <li>Players self-select, and many will have heard of the Stanford study.</li>
          <li>One ten-minute session says very little about any single person. The results page describes how you played, not who you are.</li>
          <li>This is not peer-reviewed research and not a psychological assessment.</li>
        </ul>
        <h2>Safety</h2>
        <p>There is no graphic content. In party mode, players can only use a fixed menu of actions and quick-chat lines, so no one can say anything cruel to a real person. The theme deals with humiliation and abuse of power; it&apos;s intended for ages 16+.</p>
      </div>
    </article>
  );
}

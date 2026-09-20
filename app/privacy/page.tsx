import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };
export default function Privacy() {
  return (
    <article className="post">
      <h1 className="display-2">Privacy</h1>
      <div className="prose">
        <p><b>No accounts, no tracking cookies, no ads.</b></p>
        <p>When you finish a game, we store an anonymous record of your in-game choices: which options you picked, how long each decision took, the random conditions you were assigned, and your resulting scores. We do not store your name, your IP address, or anything else that identifies you. (Our hosting provider keeps standard, short-lived server logs.) The name you type in the game stays in your own browser.</p>
        <p>These records are used only to show aggregate results on the site and to improve the game.</p>
        <p><b>Removing your data.</b> After a solo game, your results page has a &ldquo;Remove it&rdquo; link that deletes your record permanently. It works from the same browser you played in.</p>
        <p><b>Party rooms</b> run over a real-time connection. What you do in a room is shared with the other players in it and is not stored, except each player&apos;s own anonymous end-of-game summary.</p>
        <p><b>Storage in your browser.</b> We keep your chosen name, sound preference and deletion keys in your browser&apos;s local storage. Clearing your browser data removes them.</p>
        <p>Questions: contact the site owner.</p>
      </div>
    </article>
  );
}

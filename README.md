# Block 9

**One night shift. How far would you go?**

A free, interactive game inspired by the 1971 Stanford Prison Experiment. Players start as a prisoner, get handed a guard's badge, and face escalating pressure (anonymity, a Warden who won't take no, a colleague, a riot, a quota with a promotion attached). Only at the end do they learn every choice was measured, and see what the situation did to them.

- **Solo story**: ~10 minutes, 20 scenes, simulated characters, timed decisions, sliders, a quota puzzle, Milgram-style authority prods. Three pressures are randomly assigned per player so the public results are fair comparisons.
- **Party mode**: 2 to 12 players on their own phones, one room code. Random roles; simulated players fill empty seats. Hidden ledgers and awards revealed at dawn. Practice mode vs bots works with no setup.
- **Live results** page with between-condition comparisons.
- **SEO**: blog (Markdown in `content/blog`), sitemap, robots, OpenGraph image, per-page metadata, Article JSON-LD.

Stack: Next.js 14 (App Router) + TypeScript. Supabase is optional (stores anonymous results and powers online party rooms).

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run sim        # balance check: 8,000 simulated solo runs + 500 party games
```

## Deploy

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/<you>/block9.git
   git push -u origin main
   ```
2. **Vercel** → Add New → Project → import the repo → Deploy. No build settings needed.
3. In Vercel → Settings → Environment Variables, set `NEXT_PUBLIC_SITE_URL` to your live URL (e.g. `https://block9.vercel.app`), then redeploy.

The site now fully works: solo mode, practice party mode, blog. Results aren't stored and online rooms are off until step 4.

4. **Supabase (free tier)** for stored results and online party rooms:
   - Create a project at supabase.com.
   - SQL Editor → paste `supabase/schema.sql` → Run.
   - Project Settings → API: copy the URL, `anon` key and `service_role` key into Vercel as
     `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
   - Redeploy.

   The `runs` table has row-level security on with no policies, so the public key can't read or write it; only the server route does. Party rooms use Supabase Realtime broadcast/presence and need no tables.

## Customise

- **Name / tagline**: `lib/site.ts` (and the `<title>` strings in `app/opengraph-image.tsx`).
- **Story**: `lib/game/story.ts`. Each scene has hidden effects on traits (`harm`, `obedience`, `conformity`, `dehumanize`, `mercy`, `defiance`). Scores are normalised automatically against the maximum possible on each player's path.
- **Archetypes & insights**: `lib/game/engine.ts`.
- **Party balance**: `G_WIN`, `P_WIN`, `NIGHT_DRIFT` and the action tables in `lib/party/engine.ts`. Run `npm run sim` after changes.
- **Blog post**: add `content/blog/my-post.md` with front matter `title`, `description`, `date` (YYYY-MM-DD). It appears in the blog, homepage and sitemap automatically.

## Ethics notes

The game withholds its purpose until the end (a debrief), tells players up front that anonymous choices are recorded, lets them delete their run afterwards, stores no identifiers, uses no free-text chat in multiplayer, and states plainly that it is not a psychological assessment.

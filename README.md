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

The Supabase project **block9** (`xchvvotvkmurtrynafat`, us-east-1) is already created and migrated, and its public URL + anon key are committed in `.env.production`. No environment variables are required.

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/<you>/block9.git
   git push -u origin main
   ```
2. **Vercel** → Add New → Project → import the repo → Deploy. That's it.
3. *(Optional)* Custom domain: add it in Vercel, then set `NEXT_PUBLIC_SITE_URL=https://yourdomain.com` so the sitemap and share images use it. Without it, Vercel's production URL is used automatically.

### Database design

`public.runs` is locked (RLS on, no policies, no grants). The site only talks to three Postgres functions, so no secret key is needed anywhere:

- `submit_run(...)`: validated insert of one anonymous run.
- `remove_run(id, token_hash)`: deletes a run only with the player's secret token (kept in their browser).
- `recent_runs(limit)`: anonymous choices for the live results page; never returns ids or tokens.

Supabase's advisor flags these as "callable by anon". That's intentional. Party rooms use Supabase Realtime broadcast + presence and need no tables. To rebuild the database elsewhere, run `supabase/schema.sql`.

## Customise

- **Name / tagline**: `lib/site.ts` (and the `<title>` strings in `app/opengraph-image.tsx`).
- **Story**: `lib/game/story.ts`. Each scene has hidden effects on traits (`harm`, `obedience`, `conformity`, `dehumanize`, `mercy`, `defiance`). Scores are normalised automatically against the maximum possible on each player's path.
- **Archetypes & insights**: `lib/game/engine.ts`.
- **Party balance**: `G_WIN`, `P_WIN`, `NIGHT_DRIFT` and the action tables in `lib/party/engine.ts`. Run `npm run sim` after changes.
- **Blog post**: add `content/blog/my-post.md` with front matter `title`, `description`, `date` (YYYY-MM-DD). It appears in the blog, homepage and sitemap automatically.

## Ethics notes

The game withholds its purpose until the end (a debrief), tells players up front that anonymous choices are recorded, lets them delete their run afterwards, stores no identifiers, uses no free-text chat in multiplayer, and states plainly that it is not a psychological assessment.

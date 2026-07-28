# Nextcloud Developer Course

> **Beta.** Only the beginner tracks are written so far, and content may still
> change. See [Current state](#current-state) before assuming something is missing
> by mistake.

A self-paced course that teaches building Nextcloud apps, in two parallel tracks.
Both tracks build the same app — a small bookmarking app called **Pinboard** — so
the two implementation styles can be compared directly.

- **PHP App Track** — a classic server app: `appinfo`, controllers, an
  `Entity`/`QBMapper` database layer, a Vue frontend, packaging for the App Store.
- **ExApp Track** — the same app as an External App in Python: FastAPI, AppAPI
  registration, SQLAlchemy, the same Vue frontend.

Each track has beginner, intermediate and advanced levels, and they converge on a
shared federation capstone lab.

## Current state

The site works and the beginner content is complete and beta-tested. The
remaining levels are outlined in the manifest but not yet written:

| | Written | Declared in manifest |
|---|---|---|
| PHP — beginner | 8 modules | 8 |
| ExApp — beginner | 8 modules | 8 |
| PHP — intermediate / advanced | — | 14 / 11 |
| ExApp — intermediate / advanced | — | 14 / 11 |
| Shared | `setup.md` | + federation capstone lab |

So `content/course-manifest.json` describes **66 modules while 16 exist**. That
gap is intentional and known — the manifest is the plan, not a promise. Missing
modules are tracked as issues.

There is **no login and no user accounts**. Progress is stored per-browser in
`localStorage` (`lib/progress.ts`), so it survives reloads but does not follow a
reader between devices. A non-functional mock login was removed before the first
publish — see `../auth-backup-2026-07-28/README.md` in the parent working
directory for the files and the reasoning.

Not deployed anywhere yet. GitHub Pages is unavailable while this repository is
private, so hosting waits on a Nextcloud-provisioned domain.

## Running it locally

Requires Node 20+.

```bash
npm ci
npm run dev     # http://localhost:3000
```

```bash
npm run build   # production build; also runs TypeScript
npm run lint    # eslint
```

`npm run build` is the useful pre-commit check — it type-checks the whole project,
so a broken import or a bad prop fails there rather than in review.

## How the content works

Course text is plain markdown on disk. Nothing is in a database, and there is no
CMS.

```
content/
  course-manifest.json     structure: tracks, levels, modules, metadata, doc links
  php/beginner/1.md … 8.md  one file per module, named by its index
  exapp/beginner/1.md … 8.md
  shared/setup.md           shared development-environment setup
```

- **`content/course-manifest.json`** is the source of truth for *structure* —
  which tracks and levels exist, module titles and order, estimated times, links
  to official docs, and flags like `federation_capstone`.
- **`content/<track>/<level>/<index>.md`** is the source of truth for *prose*.
  `lib/content.ts` resolves a module to its file by that path, so adding a module
  means adding both a manifest entry and a matching file.

Each markdown file follows one convention that the renderer depends on:

- a single `# ` heading — the module title
- the lines before the first `## ` — module metadata (track, estimated time, git
  tags, what the reader will have when done)
- every `## ` heading — one **section**, which becomes one navigable step in the
  player, tracked individually for progress

So `##` is structural, not cosmetic. Splitting or merging a `##` changes the
reader's step count and their stored progress for that module.

## Layout

```
app/                      routes (App Router)
  page.tsx                catalog
  [track]/[level]/        module list for a level
  [track]/[level]/[module]/  the module player
components/               TopBar, CatalogClient, LevelCatalogClient, ModulePlayerClient
lib/
  manifest.ts             reads and types the manifest
  content.ts              loads markdown, parses headers, splits sections
  progress.ts             localStorage progress tracking
  feedback.ts             builds prefilled GitHub issue links
content/                  the course itself (see above)
```

Built with Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4, and
`react-markdown` with `remark-gfm` and `rehype-highlight`.

> **Note for AI coding assistants:** see `AGENTS.md`. This Next.js version has
> breaking changes relative to most training data — check
> `node_modules/next/dist/docs/` before writing code against Next APIs.

## Feedback

Please open an issue. Every page has a **Report an error** button and a link in
the beta banner; from a module page these arrive prefilled with which module you
were reading.

Note that while this repository is private, those links only work for people with
access to it — that has to be resolved before the course is handed to outside
beta testers.

## Contributing

Commits need a `Signed-off-by` line (DCO):

```bash
git commit -s -m "your message"
```

When adding or changing content, keep `content/course-manifest.json` and the
markdown files consistent — a module needs an entry in both places to be
reachable.

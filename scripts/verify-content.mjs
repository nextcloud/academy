#!/usr/bin/env node
/**
 * Checks the course content against reality.
 *
 * Two modes, on purpose:
 *
 *   --offline  (default)  Nothing leaves the machine. Safe to gate every pull
 *                         request on, because it cannot fail for reasons
 *                         outside this repository.
 *   --online              Adds checks against the network: links, the docs
 *                         site, the nextcloud-docker-dev repo, image tags.
 *                         Run on a slow timer, never as a PR gate - a vendor
 *                         rotating a URL must not block somebody's typo fix.
 *
 * Exit code is 1 if any check fails, 0 otherwise. Warnings never fail the run.
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const CONTENT = path.join(ROOT, 'content')
const ONLINE = process.argv.includes('--online')

const failures = []
const warnings = []
const notes = []

const fail = (m) => failures.push(m)
const warn = (m) => warnings.push(m)
const note = (m) => notes.push(m)

/** Every markdown file under content/, as [relativePath, text]. */
function markdownFiles(dir = CONTENT) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...markdownFiles(full))
    else if (entry.name.endsWith('.md')) out.push([path.relative(ROOT, full), fs.readFileSync(full, 'utf-8')])
  }
  return out
}

const manifest = JSON.parse(fs.readFileSync(path.join(CONTENT, 'course-manifest.json'), 'utf-8'))
const PIN = manifest.course?.targetNextcloudVersion
const VARIABLES = { nextcloudVersion: PIN }
const KNOWN_VARIABLES = new Set(Object.keys(VARIABLES))
const files = markdownFiles()

/**
 * Mirrors substituteVariables() in lib/content.ts. Checks that care about what
 * the reader ends up seeing - links, above all - must run against the rendered
 * text, or they check a token instead of a URL.
 */
const render = (text) => text.replace(/\{\{(\w+)\}\}/g, (whole, name) => VARIABLES[name] ?? whole)

// ---------------------------------------------------------------- offline ---

function checkPin() {
  if (!PIN) return fail('course-manifest.json has no course.targetNextcloudVersion')
  if (!/^\d+$/.test(PIN)) fail(`targetNextcloudVersion should be a bare major, got ${JSON.stringify(PIN)}`)
}

/** A `{{token}}` nobody substitutes renders literally to the reader. */
function checkVariablesAreKnown() {
  for (const [file, text] of files) {
    for (const m of text.matchAll(/\{\{(\w+)\}\}/g)) {
      if (!KNOWN_VARIABLES.has(m[1])) fail(`${file}: unknown variable {{${m[1]}}}`)
    }
  }
}

/**
 * A literal version equal to the pin is a reference somebody forgot to
 * template, so the next bump will silently leave it behind.
 */
function checkPinIsNotHardcoded() {
  if (!PIN) return
  const patterns = [
    new RegExp(`stable${PIN}\\b`, 'g'),
    new RegExp(`\\bNextcloud ${PIN}\\b`, 'g'),
    new RegExp(`min-version="${PIN}"`, 'g'),
  ]
  for (const [file, text] of files) {
    for (const re of patterns) {
      for (const m of text.matchAll(re)) {
        const line = text.slice(0, m.index).split('\n').length
        warn(`${file}:${line}: literal "${m[0]}" - should this be {{nextcloudVersion}}?`)
      }
    }
  }
}

/**
 * The checklist a human works through when the pin moves. These are claims true
 * of one release and not the next, which is exactly why they are NOT templated:
 * substituting them would turn a visibly stale number into a confidently wrong
 * sentence. See AGENTS.md.
 */
function listReleaseSpecificClaims() {
  const re = /\bNC(\d+)\b|\bNextcloud (\d+)\b/g
  const found = []
  for (const [file, text] of files) {
    const lines = text.split('\n')
    lines.forEach((line, i) => {
      for (const m of line.matchAll(re)) {
        const version = m[1] ?? m[2]
        if (version === PIN) continue // covered by checkPinIsNotHardcoded
        found.push(`${file}:${i + 1}: mentions NC${version} - ${line.trim().slice(0, 100)}`)
      }
    })
  }
  if (found.length) {
    note(`${found.length} release-specific references to re-read when the pin moves:`)
    found.forEach((f) => note(`    ${f}`))
  }
}

/** A manifest entry pointing at a file nobody wrote renders as a dead module. */
function checkStandaloneFilesExist() {
  const categories = manifest.standalone?.categories ?? {}
  for (const [catId, cat] of Object.entries(categories)) {
    for (const mod of cat.modules ?? []) {
      if (!mod.file) continue
      const full = path.join(CONTENT, mod.file)
      if (!fs.existsSync(full)) fail(`manifest standalone ${catId}/${mod.id}: missing content file ${mod.file}`)
    }
  }
}

// ----------------------------------------------------------------- online ---

/**
 * URLs that are illustrations rather than destinations: local addresses the
 * reader will run themselves, and stand-ins they are meant to replace with
 * their own. Checking these produces permanent noise, and noise is how a
 * report stops being read.
 */
const PLACEHOLDER =
  /localhost|127\.0\.0\.1|0\.0\.0\.0|\.local\b|example\.com|host\.docker\.internal|YOUR_|your-nextcloud|<[^>]*>|PORT/

const seen = new Map()
async function head(url, { retries = 1 } = {}) {
  if (seen.has(url)) return seen.get(url)
  let status = 0
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(25_000) })
      status = res.status
      if (status < 400) break
    } catch {
      status = 0
    }
    if (attempt < retries) await new Promise((r) => setTimeout(r, 1500))
  }
  seen.set(url, status)
  // Deliberately unhurried: this runs on a timer, not in anybody's way, and
  // being polite to other people's servers costs us nothing here.
  await new Promise((r) => setTimeout(r, 300))
  return status
}

async function checkLinks() {
  const urls = new Set()
  for (const [, raw] of files) {
    const text = render(raw)
    for (const m of text.matchAll(/https?:\/\/[^\s)<>"'`\]]+/g)) {
      const url = m[0].replace(/[.,;:]+$/, '')
      if (PLACEHOLDER.test(url)) continue
      urls.add(url)
    }
  }
  note(`checking ${urls.size} unique links`)
  for (const url of urls) {
    const status = await head(url)
    if (status === 0) warn(`link unreachable: ${url}`)
    // 403 and 429 mean the server dislikes CI, not that the page is gone.
    else if (status === 403 || status === 429) warn(`link ${status} (bot-blocked?): ${url}`)
    else if (status >= 400) fail(`link ${status}: ${url}`)
  }
}

/** Is the version the course targets still the current one? */
async function checkPinAgainstDocs() {
  if (!PIN) return
  const pinned = `https://docs.nextcloud.com/server/${PIN}/admin_manual/installation/system_requirements.html`
  if ((await head(pinned)) >= 400) fail(`no admin manual for the pinned version: ${pinned}`)

  try {
    const res = await fetch('https://docs.nextcloud.com/server/stable/admin_manual/installation/system_requirements.html', {
      redirect: 'follow',
      signal: AbortSignal.timeout(25_000),
    })
    const title = (await res.text()).match(/<title>[^<]*Nextcloud (\d+)/)
    if (!title) return warn('could not read the current stable version from the docs site')
    const stable = Number(title[1])
    if (Number(PIN) < stable) {
      warn(`the course targets Nextcloud ${PIN}; current stable is ${stable}. Consider bumping course.targetNextcloudVersion.`)
      note(`  system requirements for ${PIN}: https://docs.nextcloud.com/server/${PIN}/admin_manual/installation/system_requirements.html`)
      note(`  ...and for ${stable}: https://docs.nextcloud.com/server/${stable}/admin_manual/installation/system_requirements.html`)
      note('  Compare the PHP versions and re-read the release-specific claims listed above before bumping.')
    }
  } catch {
    warn('docs.nextcloud.com unreachable')
  }
}

/**
 * The setup module tells readers to run specific things in a repository we do
 * not control. This is the check that would have caught the hosts step going
 * stale, and the stableXX container needing its own checkout.
 */
async function checkDockerDev() {
  const raw = (f) => `https://raw.githubusercontent.com/nextcloud/nextcloud-docker-dev/master/${f}`
  const get = async (f) => {
    try {
      const res = await fetch(raw(f), { signal: AbortSignal.timeout(25_000) })
      return res.ok ? await res.text() : null
    } catch {
      return null
    }
  }

  const compose = await get('docker-compose.yml')
  if (!compose) return warn('could not fetch nextcloud-docker-dev/docker-compose.yml')

  for (const service of ['nextcloud', 'proxy', `stable${PIN}`]) {
    if (!new RegExp(`^\\s{2}${service}:`, 'm').test(compose)) {
      fail(`nextcloud-docker-dev no longer defines the "${service}" service, which the setup module tells readers to start`)
    }
  }

  const bootstrap = await get('bootstrap.sh')
  if (!bootstrap) warn('could not fetch nextcloud-docker-dev/bootstrap.sh')
  else if (!/update-hosts/.test(bootstrap)) {
    fail('bootstrap.sh no longer runs scripts/update-hosts - the setup module says it adds the hostnames for you')
  }

  if ((await get('scripts/occ.sh')) === null) {
    fail('nextcloud-docker-dev/scripts/occ.sh is gone - the course uses it throughout')
  }
}

/** A module that tells people to pull an image that no longer exists is a wall. */
async function checkImages() {
  for (const image of ['nextcloud-dev-php85', 'nextcloud-dev-php83']) {
    try {
      const tokenRes = await fetch(`https://ghcr.io/token?scope=repository:nextcloud/${image}:pull&service=ghcr.io`, {
        signal: AbortSignal.timeout(25_000),
      })
      const { token } = await tokenRes.json()
      const res = await fetch(`https://ghcr.io/v2/nextcloud/${image}/manifests/latest`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.oci.image.index.v1+json,application/vnd.docker.distribution.manifest.list.v2+json',
        },
        signal: AbortSignal.timeout(25_000),
      })
      if (!res.ok) fail(`container image ghcr.io/nextcloud/${image}:latest is not available (HTTP ${res.status})`)
    } catch {
      warn(`could not check ghcr.io/nextcloud/${image}`)
    }
  }
}

// ------------------------------------------------------------------- run ---

checkPin()
checkVariablesAreKnown()
checkPinIsNotHardcoded()
checkStandaloneFilesExist()
listReleaseSpecificClaims()

if (ONLINE) {
  await checkLinks()
  await checkPinAgainstDocs()
  await checkDockerDev()
  await checkImages()
}

const heading = ONLINE ? 'online' : 'offline'
console.log(`\ncourse content verification (${heading}) - target Nextcloud ${PIN}\n`)
if (notes.length) console.log(notes.map((n) => `  ${n}`).join('\n') + '\n')
if (warnings.length) console.log('WARNINGS\n' + warnings.map((w) => `  ! ${w}`).join('\n') + '\n')
if (failures.length) console.log('FAILURES\n' + failures.map((f) => `  x ${f}`).join('\n') + '\n')
console.log(`${failures.length} failure(s), ${warnings.length} warning(s)`)
process.exit(failures.length ? 1 : 0)

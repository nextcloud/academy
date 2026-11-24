<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Writing course content

## The Nextcloud version the course targets

The major the course is written against lives in **one place**:
`content/course-manifest.json` → `course.targetNextcloudVersion`. In module markdown, write
**`{{nextcloudVersion}}`** and it is substituted when the module is read (`lib/content.ts`).

**Use the variable only for facts that stay true of whatever version is pinned:**

- the `<nextcloud min-version max-version>` range in an `info.xml` example
- "a running Nextcloud `{{nextcloudVersion}}` development instance"
- expected `occ status` output, `version: {{nextcloudVersion}}.x.x`
- the branch or container name, `stable{{nextcloudVersion}}`

**Write the version out in full for anything true of one release and not the next**, for example
which PHP versions it supports, what an upgrade removed, or which library version pairs with it.
Substituting those would turn a visibly stale number into a confidently wrong sentence, which is
worse than leaving it. Put release-specific claims in the module's `## NC<version> notes` section, so
the paragraphs a human must re-read when the pin moves are all in one predictable place.

**Historical references never use the variable.** "Added in NC29", "the standard since NC20" and
"ships with 30+" are facts about the past and must not move with the pin.

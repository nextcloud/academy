export const REPO_URL = 'https://github.com/nextcloud/academy'
export const ISSUES_URL = `${REPO_URL}/issues`

/**
 * Link to a new GitHub issue on nextcloud/academy.
 *
 * `context` is a human-readable location in the course (e.g.
 * "PHP App Track / Beginner / Module 3: Backend Fundamentals"). When given, the
 * issue title and body are prefilled with it, so a report arrives with the page
 * already identified instead of "there's a typo somewhere".
 */
export function newIssueUrl(context?: string): string {
  if (!context) return `${ISSUES_URL}/new`

  const params = new URLSearchParams({
    title: `Feedback: ${context}`,
    body: [
      `**Where:** ${context}`,
      '',
      '**What is wrong or unclear**',
      '',
      '',
      '**What you expected instead**',
      '',
    ].join('\n'),
  })
  return `${ISSUES_URL}/new?${params.toString()}`
}

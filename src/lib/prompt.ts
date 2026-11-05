/** Embedded Conventional Commit instructions (no external skill file). */
const COMMIT_SKILL = `
Analyze staged git changes and generate a professional commit message strictly adhering to the Conventional Commits specification.

## Input
- Run \`git diff --staged\` in this repository and analyze only those changes.

## Structure
\`\`\`text
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

## Guidelines
- **Type**: lowercase — feat, fix, docs, style, refactor, test, chore, etc.
- **Scope**: module or component; omit parentheses if global.
- **Subject**: imperative mood, ≤50 characters, lowercase (except proper nouns), no trailing period.
- **Body**: blank line after subject; explain what and why; use \`-\` bullets when needed.
- **Footer**: optional BREAKING CHANGE or Closes #n; omit if not applicable.

## Process
1. Read the staged diff thoroughly.
2. Pick type and scope from the primary intent.
3. Draft subject, then body/footer if needed.
4. Return ONLY the final commit message inside a single \`\`\`text fenced code block. No other text.
`.trim();

export function buildCommitMessagePrompt(): string {
  return COMMIT_SKILL;
}

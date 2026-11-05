const FRIENDLY_RULES: { test: RegExp; format: (match: RegExpMatchArray | null, line: string) => string }[] = [
  {
    test: /No staged changes in (.+)\./,
    format: (m) =>
      m?.[1]
        ? `No staged changes in ${m[1]}. Stage your changes with git add first.`
        : "No staged changes. Stage your changes with git add first.",
  },
  {
    test: /Not a git repository/,
    format: () => "This folder is not a git repository.",
  },
  {
    test: /Antigravity CLI not found/,
    format: () => "Antigravity (agy) is not installed or not on your PATH.",
  },
  {
    test: /cursor-agent not found/,
    format: () => "Cursor CLI is not installed or not on your PATH.",
  },
  {
    test: /claude CLI not found/,
    format: () => "Claude Code CLI is not installed or not on your PATH.",
  },
  {
    test: /jq is required/,
    format: () => "The generate-commit-message script needs jq (brew install jq).",
  },
  {
    test: /Model returned an empty commit message/,
    format: () => "The AI returned an empty message. Try again or change agent.",
  },
  {
    test: /CLI not found/,
    format: () => "generate-commit-message script is missing from ~/.local/bin.",
  },
];

function isNoiseLine(line: string): boolean {
  return (
    line.startsWith("Command failed:") ||
    line.includes("generate-commit-message") ||
    line.includes("--agent") ||
    line.includes("--repo")
  );
}

export function friendlyGenerateError(error: unknown, stderr?: string): string {
  const chunks: string[] = [];
  if (stderr?.trim()) chunks.push(stderr.trim());
  if (error instanceof Error && error.message.trim()) chunks.push(error.message.trim());

  const lines = chunks
    .join("\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    for (const rule of FRIENDLY_RULES) {
      if (rule.test.test(line)) {
        return rule.format(line.match(rule.test), line);
      }
    }
    if (!isNoiseLine(line)) {
      return line;
    }
  }

  return "Could not generate commit message. Check staged changes and try again.";
}

# Commit Message Generator Changelog

## [Standalone extension with agent auto-detect] - {PR_MERGE_DATE}

- Generate commit messages by calling agent CLIs directly (no external shell script or skill file)
- Detect installed agents from PATH; support Antigravity, Cursor, Claude Code, OpenCode, Codex, Gemini CLI, and GitHub Copilot CLI
- Store repositories and default agent in Raycast Local Storage (one-time migration from legacy `repos.conf` if present)
- Conventional Commit rules embedded in the extension prompt

## [Initial release] - {PR_MERGE_DATE}

- Pick a git repository, generate from staged changes, copy message to clipboard
- Add repositories via folder picker or Finder selection
- Sort repositories by recent activity; shortcuts for generate, agent, copy path, and remove

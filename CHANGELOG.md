# Changelog

## 1.1.0 — 2026-11-05

- Auto-detect installed agent CLIs on PATH (`--list-agents` / `--verbose`)
- Agents: Antigravity, Cursor, Claude Code, OpenCode, Codex, Gemini CLI, GitHub Copilot CLI
- Raycast UI lists only installed agents; default falls back if saved agent is missing
- Shared `agent-registry.json` for CLI and extension metadata

## 1.0.0 — 2026-11-05

First stable release.

- Single command **Commit Message Generator** with native Raycast UI
- Repo list sorted by recent activity with relative time accessories
- Generate with default agent (Antigravity / Cursor / Claude) via `~/.local/bin/generate-commit-message`
- Add repositories (folder picker, Finder selection) → `~/.config/generate-commit-message/repos.conf`
- Persist default agent in Raycast Local Storage
- Shortcuts: Enter generate, ⌃A agent, ⌘C copy path, Raycast Remove shortcut for delete repo
- Close Raycast + toast progress on generate; friendly error messages

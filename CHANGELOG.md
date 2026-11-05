# Changelog

## 1.0.0 — 2026-11-05

First stable release.

- Single command **Commit Message Generator** with native Raycast UI
- Repo list sorted by recent activity with relative time accessories
- Generate with default agent (Antigravity / Cursor / Claude) via `~/.local/bin/generate-commit-message`
- Add repositories (folder picker, Finder selection) → `~/.config/generate-commit-message/repos.conf`
- Persist default agent in Raycast Local Storage
- Shortcuts: Enter generate, ⌃A agent, ⌘C copy path, Raycast Remove shortcut for delete repo
- Close Raycast + toast progress on generate; friendly error messages

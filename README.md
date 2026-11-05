# Commit Message Generator (Raycast)

Raycast extension for generating Conventional Commit messages from staged git diffs.

**Version:** 1.1.0  
**CLI:** `~/.local/bin/generate-commit-message`  
**Repos:** `~/.config/generate-commit-message/repos.conf`

## Production install (released)

1. Build once:

   ```bash
   cd ~/.local/share/generate-commit-message/raycast-extension
   npm install
   npm run build
   ```

2. Stop development mode if it was running (`Ctrl+C` on `npm run dev`).

3. In Raycast: **Extensions** → **+** → **Import Extension** → choose this folder  
   (`~/.local/share/generate-commit-message/raycast-extension`).

4. Assign a hotkey to **Commit Message Generator** in Raycast preferences.

Raycast loads the built extension from `dist/` — no need to keep `npm run dev` running.

## Development

```bash
npm run dev
```

## Usage

1. Open **Commit Message Generator**
2. **Enter** on a repo → generate with default agent → clipboard
3. **⌘K** → Add Repositories / Select Default Agent (**⌃A**), Copy path (**⌘C**), Remove repo

Only agent CLIs found on your PATH appear in **Select Default Agent**. Supported agents (when installed):

| Agent | Binary (first match) |
|--------|----------------------|
| Antigravity | `agy` |
| Cursor | `cursor-agent`, `agent` |
| Claude Code | `claude` |
| OpenCode | `opencode` |
| OpenAI Codex | `codex` |
| Gemini CLI | `gemini` |
| GitHub Copilot CLI | `copilot` |

List installed agents from the terminal:

```bash
generate-commit-message --list-agents --verbose
```

Registry: `~/.local/share/generate-commit-message/agent-registry.json` (also in this repo as `agent-registry.json`).

## Publish to Raycast Store (optional)

Requires Raycast account and store review:

```bash
npm run lint
npm run build
npm run publish
```

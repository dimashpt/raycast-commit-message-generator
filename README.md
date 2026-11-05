# Commit Message Generator

Generate **Conventional Commit** messages from **staged** git changes using a **coding-agent CLI** on your Mac (Antigravity, Cursor, Claude Code, OpenCode, Codex, and others).

This Raycast extension is **standalone**: it runs agent commands in-process. It does **not** require a separate install script, skill file, or config file on disk.

| | |
|---|---|
| **Platform** | macOS |
| **Author** | [dimashpt](https://www.raycast.com/dimashpt) |
| **License** | MIT |

## Requirements

Before using the extension, make sure you have:

1. **git** — validate and read staged diffs  
2. **At least one agent CLI** on your `PATH` when Raycast launches (see [Supported agents](#supported-agents))  
3. **Staged changes** in the repo you pick (`git add` before generating)

Raycast uses a minimal shell `PATH`. This extension also checks `~/.local/bin`, Homebrew, and `/usr/local/bin`. Set `GCM_*_BIN` if your CLI lives elsewhere.

## Installation

### From the Raycast Store

1. Open **Raycast** → **Store** (or **Extensions** → **Browse Extensions**).  
2. Search for **Commit Message Generator**.  
3. Click **Install**.  
4. Optional: assign a hotkey under **Extensions** → **Commit Message Generator** → **Preferences**.

### From source (development)

1. Clone this repository.  
2. In the project folder:

   ```bash
   npm install
   npm run build
   ```

3. In Raycast: **Settings** → **Extensions** → **+** → **Import Extension** → select the **`dist/`** folder.  
4. For live reload while editing: `npm run dev` (keep the process running).

## Getting started

After installation:

1. **Install an agent CLI** if you do not have one yet (e.g. `brew install` for `claude`, or install `cursor-agent`, `agy`, etc.).  
2. Open **Commit Message Generator** in Raycast.  
3. Press **⌘K** → **Add Repositories…** and choose one or more git folders (or **Add Finder Selection**).  
4. Press **⌘K** → **Select Default Agent…** (**⌃A**) and pick an agent that appears in the list (only installed CLIs are shown).  
5. In your project terminal: `git add` the files you want in the commit.  
6. In Raycast, select the repository and press **Enter** — the message is generated and **copied to the clipboard**.

Repositories, your default agent, and “last used” sorting are stored in **Raycast Local Storage** (not in a file under `~/.config`).

## Supported agents

| Agent | Binary (first match on PATH) |
|--------|------------------------------|
| Antigravity | `agy` |
| Cursor | `cursor-agent`, `agent` |
| Claude Code | `claude` |
| OpenCode | `opencode` |
| OpenAI Codex | `codex` |
| Gemini CLI | `gemini` |
| GitHub Copilot CLI | `copilot` |

Optional model env vars: `GCM_MODEL_*`, `GENERATE_COMMIT_MESSAGE_MODEL` (see [`agent-registry.json`](agent-registry.json)).

## Keyboard shortcuts (in the repo list)

| Action | Shortcut |
|--------|----------|
| Generate | **Enter** |
| Select default agent | **⌃A** |
| Copy repository path | **⌘C** |
| Remove repository | Raycast **Remove** (e.g. **⌃X**) |

## Optional terminal CLI

The [`cli/`](cli/) folder contains an optional bash wrapper for terminal use. The Raycast extension **does not** use it.

## Publish to the Raycast Store (maintainers)

```bash
npx ray login
npm run release
npm run publish
```

Store screenshots belong in [`metadata/`](metadata/) (2000×1250 PNG, via Raycast **Capture Window** → **Save to Metadata**). See [Raycast Store guidelines](https://developers.raycast.com/basics/prepare-an-extension-for-store).

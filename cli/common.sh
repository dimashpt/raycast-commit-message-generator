# shellcheck shell=bash
# Shared helpers for generate-commit-message.

GCM_CONFIG_DIR="${GCM_CONFIG_DIR:-$HOME/.config/generate-commit-message}"
GCM_REPOS_FILE="${GCM_REPOS_FILE:-$GCM_CONFIG_DIR/repos.conf}"
GCM_SHARE="${GCM_SHARE:-$HOME/.local/share/generate-commit-message}"
GCM_REGISTRY="${GCM_REGISTRY:-$GCM_SHARE/agent-registry.json}"

GCM_AGY_BIN="${GCM_AGY_BIN:-agy}"
GCM_CURSOR_BIN="${GCM_CURSOR_BIN:-cursor-agent}"
GCM_CLAUDE_BIN="${GCM_CLAUDE_BIN:-claude}"
GCM_OPENCODE_BIN="${GCM_OPENCODE_BIN:-opencode}"
GCM_CODEX_BIN="${GCM_CODEX_BIN:-codex}"
GCM_GEMINI_BIN="${GCM_GEMINI_BIN:-gemini}"
GCM_COPILOT_BIN="${GCM_COPILOT_BIN:-copilot}"

GCM_MODEL_AGY="${GENERATE_COMMIT_MESSAGE_MODEL:-${GCM_MODEL_AGY:-gemini-3.8-flash-low}}"
GCM_MODEL_CURSOR="${GENERATE_COMMIT_MESSAGE_MODEL_CURSOR:-${GCM_MODEL_CURSOR:-}}"
GCM_MODEL_CLAUDE="${GENERATE_COMMIT_MESSAGE_MODEL_CLAUDE:-${GCM_MODEL_CLAUDE:-}}"
GCM_MODEL_OPENCODE="${GCM_MODEL_OPENCODE:-}"
GCM_MODEL_CODEX="${GCM_MODEL_CODEX:-}"
GCM_MODEL_GEMINI="${GCM_MODEL_GEMINI:-}"
GCM_MODEL_COPILOT="${GCM_MODEL_COPILOT:-}"

gcm_prompt() {
  cat <<'EOF'
/commit-message-generator

Analyze staged changes in this git repository (run `git diff --staged`). Follow the commit-message-generator skill exactly. Output ONLY the final commit message inside a single ```text fenced code block. No other text.
EOF
}

gcm_extract_codeblock() {
  local text="$1"
  if [[ "$text" != *'```'* ]]; then
    printf '%s' "$text"
    return
  fi
  printf '%s\n' "$text" | awk '
    /^```/ {
      if (!inside) { inside = 1; next }
      exit
    }
    inside { print }
  '
}

gcm_trim_message() {
  local message="$1"
  message="$(printf '%s\n' "$message" | sed -e '/./,$!d' -e :a -e '/^\n*$/{$d;N;ba' -e '}')"
  printf '%s' "$message"
}

gcm_validate_repo() {
  local root="$1"
  if [[ ! -d "$root" ]]; then
    echo "Repo path does not exist: $root" >&2
    return 1
  fi
  if ! git -C "$root" rev-parse --git-dir >/dev/null 2>&1; then
    echo "Not a git repository: $root" >&2
    return 1
  fi
  if git -C "$root" diff --staged --quiet; then
    echo "No staged changes in $(basename "$root"). Stage files first (git add)." >&2
    return 1
  fi
}

gcm_registry_ids() {
  jq -r '.agents[].id' "$GCM_REGISTRY"
}

gcm_registry_field() {
  local id="$1"
  local field="$2"
  jq -r --arg id "$id" --arg field "$field" '.agents[] | select(.id == $id) | .[$field] // empty' "$GCM_REGISTRY"
}

gcm_is_known_agent() {
  local id="$1"
  jq -e --arg id "$id" '.agents[] | select(.id == $id)' "$GCM_REGISTRY" >/dev/null 2>&1
}

gcm_resolve_agent_bin() {
  local id="$1"
  local env_name env_bin bin

  env_name="$(gcm_registry_field "$id" envBin)"
  if [[ -n "$env_name" && "$env_name" != "null" ]]; then
    env_bin="${!env_name-}"
    if [[ -n "$env_bin" ]] && command -v "$env_bin" >/dev/null 2>&1; then
      printf '%s' "$env_bin"
      return 0
    fi
  fi

  while IFS= read -r bin; do
    [[ -z "$bin" || "$bin" == "null" ]] && continue
    if command -v "$bin" >/dev/null 2>&1; then
      printf '%s' "$bin"
      return 0
    fi
  done < <(jq -r --arg id "$id" '.agents[] | select(.id == $id) | .binaries[]?' "$GCM_REGISTRY")

  return 1
}

gcm_agent_not_found() {
  local id="$1"
  local title bins
  title="$(gcm_registry_field "$id" title)"
  bins="$(jq -r --arg id "$id" '.agents[] | select(.id == $id) | .binaries | join(", ")' "$GCM_REGISTRY")"
  echo "${title} CLI not found (looked for: ${bins} on PATH)." >&2
}

# Usage: gcm_list_installed_agents [verbose]
gcm_list_installed_agents() {
  local mode="${1:-}"
  local id bin title
  while IFS= read -r id; do
    [[ -z "$id" ]] && continue
    bin="$(gcm_resolve_agent_bin "$id" 2>/dev/null || true)"
    [[ -z "$bin" ]] && continue
    if [[ "$mode" == "verbose" ]]; then
      title="$(gcm_registry_field "$id" title)"
      printf '%s|%s|%s\n' "$id" "$title" "$bin"
    else
      printf '%s\n' "$id"
    fi
  done < <(gcm_registry_ids)
}

gcm_run_agent() {
  local agent="$1"
  local root="$2"
  local prompt="$3"
  local raw="$4"
  local err="$5"

  local runner bin
  runner="$(gcm_registry_field "$agent" runner)"
  bin="$(gcm_resolve_agent_bin "$agent")" || {
    gcm_agent_not_found "$agent"
    return 1
  }

  case "$runner" in
    agy)
      local -a agy_args=(-p "$prompt" --dangerously-skip-permissions --output-format json)
      if [[ -n "$GCM_MODEL_AGY" ]]; then
        agy_args+=(--model "$GCM_MODEL_AGY")
      fi
      (cd "$root" && "$bin" "${agy_args[@]}" >"$raw" 2>"$err")
      ;;
    cursor)
      local -a cursor_args=(
        -p "$prompt"
        --output-format json
        --mode ask
        --force
      )
      if [[ -n "$GCM_MODEL_CURSOR" ]]; then
        cursor_args+=(--model "$GCM_MODEL_CURSOR")
      fi
      (cd "$root" && "$bin" "${cursor_args[@]}" >"$raw" 2>"$err")
      ;;
    claude)
      local -a claude_args=(
        -p "$prompt"
        --output-format json
        --add-dir "$root"
        --dangerously-skip-permissions
      )
      if [[ -n "$GCM_MODEL_CLAUDE" ]]; then
        claude_args+=(--model "$GCM_MODEL_CLAUDE")
      fi
      (cd "$root" && "$bin" "${claude_args[@]}" >"$raw" 2>"$err")
      ;;
    opencode)
      local -a opencode_args=(run --format json --auto --standalone "$prompt")
      if [[ -n "$GCM_MODEL_OPENCODE" ]]; then
        opencode_args=(run --format json --auto --standalone --model "$GCM_MODEL_OPENCODE" "$prompt")
      fi
      (cd "$root" && "$bin" "${opencode_args[@]}" >"$raw" 2>"$err")
      ;;
    codex)
      local -a codex_args=(exec --approve-for-me "$prompt")
      if [[ -n "$GCM_MODEL_CODEX" ]]; then
        codex_args=(-c "model=\"$GCM_MODEL_CODEX\"" exec --approve-for-me "$prompt")
      fi
      (cd "$root" && "$bin" "${codex_args[@]}" >"$raw" 2>"$err")
      ;;
    gemini)
      local -a gemini_args=(--prompt "$prompt" --yolo --output-format json)
      if [[ -n "$GCM_MODEL_GEMINI" ]]; then
        gemini_args+=(--model "$GCM_MODEL_GEMINI")
      fi
      (cd "$root" && "$bin" "${gemini_args[@]}" >"$raw" 2>"$err")
      ;;
    copilot)
      local -a copilot_args=(-p "$prompt")
      if [[ -n "$GCM_MODEL_COPILOT" ]]; then
        copilot_args+=(--model "$GCM_MODEL_COPILOT")
      fi
      (cd "$root" && "$bin" "${copilot_args[@]}" >"$raw" 2>"$err")
      ;;
    *)
      echo "No runner configured for agent: $agent" >&2
      return 1
      ;;
  esac
}

gcm_parse_agent_response() {
  local agent="$1"
  local raw="$2"

  local parse_kind response=""
  parse_kind="$(gcm_registry_field "$agent" parse)"

  case "$parse_kind" in
    agy)
      local status
      status="$(jq -r '.status // empty' "$raw")"
      if [[ "$status" != "SUCCESS" ]]; then
        jq -r '.error // .response // "Antigravity run failed."' "$raw" >&2
        return 1
      fi
      response="$(jq -r '.response // empty' "$raw")"
      ;;
    cursor)
      response="$(jq -r '.result // .response // .text // empty' "$raw")"
      if [[ -z "$response" ]]; then
        response="$(jq -r '.. | strings' "$raw" 2>/dev/null | tail -1 || true)"
      fi
      ;;
    claude)
      response="$(jq -r '.result // empty' "$raw")"
      if [[ -z "$response" ]]; then
        response="$(jq -r '[.. | strings] | join("\n")' "$raw" 2>/dev/null || true)"
      fi
      ;;
    opencode)
      response="$(jq -r '.content // .message // .text // .result // empty' "$raw")"
      if [[ -z "$response" ]]; then
        response="$(jq -r '[.. | strings] | join("\n")' "$raw" 2>/dev/null || true)"
      fi
      ;;
    gemini)
      response="$(jq -r '.response // .result // .text // empty' "$raw")"
      if [[ -z "$response" ]]; then
        response="$(jq -r '[.. | strings] | join("\n")' "$raw" 2>/dev/null || true)"
      fi
      ;;
    copilot)
      response="$(jq -r '.result // .response // .message // empty' "$raw" 2>/dev/null || true)"
      if [[ -z "$response" ]]; then
        response="$(cat "$raw" 2>/dev/null || true)"
      fi
      ;;
    text)
      response="$(cat "$raw" 2>/dev/null || true)"
      ;;
    *)
      response="$(cat "$raw" 2>/dev/null || true)"
      ;;
  esac

  if [[ -z "${response//[[:space:]]/}" ]]; then
    echo "Agent returned an empty response." >&2
    return 1
  fi
  printf '%s' "$response"
}

gcm_generate_in_repo() {
  local agent="$1"
  local root="$2"

  if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required but not installed." >&2
    return 1
  fi

  root="$(cd "$root" && git rev-parse --show-toplevel)"
  gcm_validate_repo "$root" || return 1

  local prompt
  prompt="$(gcm_prompt)"

  local raw err
  raw="$(mktemp)"
  err="${raw}.err"
  trap 'rm -f "$raw" "$err"' RETURN

  if ! gcm_run_agent "$agent" "$root" "$prompt" "$raw" "$err"; then
    [[ -s "$err" ]] && cat "$err" >&2
    return 1
  fi

  local response message
  response="$(gcm_parse_agent_response "$agent" "$raw")" || return 1
  message="$(gcm_extract_codeblock "$response")"
  message="$(gcm_trim_message "$message")"

  if [[ -z "${message//[[:space:]]/}" ]]; then
    echo "Model returned an empty commit message." >&2
    return 1
  fi

  printf '%s' "$message" | pbcopy
  printf '%s\n' "$message"
}

# Populated by gcm_load_repo_entries (bash 3.2–safe; no namerefs).
GCM_REPO_LABELS=()
GCM_REPO_PATHS=()

gcm_load_repo_entries() {
  GCM_REPO_LABELS=()
  GCM_REPO_PATHS=()

  [[ -f "$GCM_REPOS_FILE" ]] || return 0

  local line label path
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" ]] && continue

    if [[ "$line" == *"|"* ]]; then
      label="${line%%|*}"
      path="${line#*|}"
    else
      path="$line"
      label="$(basename "$path")"
    fi
    label="${label#"${label%%[![:space:]]*}"}"
    label="${label%"${label##*[![:space:]]}"}"
    path="${path#"${path%%[![:space:]]*}"}"
    path="${path%"${path##*[![:space:]]}"}"
    path="${path/#\~/$HOME}"

    GCM_REPO_LABELS+=("$label")
    GCM_REPO_PATHS+=("$path")
  done <"$GCM_REPOS_FILE"
}

gcm_choose_from_list() {
  local prompt="$1"
  shift
  local -a items=("$@")
  local i item escaped_items=""
  for item in "${items[@]}"; do
    item="${item//\\/\\\\}"
    item="${item//\"/\\\"}"
    if [[ -n "$escaped_items" ]]; then
      escaped_items+=", "
    fi
    escaped_items+="\"$item\""
  done

  osascript <<EOF 2>/dev/null
set chosen to choose from list {$escaped_items} with prompt "$prompt"
if chosen is false then
  return ""
end if
return item 1 of chosen
EOF
}

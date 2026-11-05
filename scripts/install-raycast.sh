#!/usr/bin/env bash
# Install Commit Message Generator as an imported Raycast extension (production build).
set -euo pipefail

EXT_ROOT="${EXT_ROOT:-$HOME/.local/share/generate-commit-message/raycast-extension}"
DIST="$EXT_ROOT/dist"

cd "$EXT_ROOT"
npm run release

if [[ ! -f "$DIST/index.js" ]]; then
  echo "Build failed: missing $DIST/index.js" >&2
  exit 1
fi

# Raycast imports the folder that contains the built bundle (dist/) as the extension root.
IMPORT_PATH="$DIST"

echo "Opening Raycast Import Extension for:"
echo "  $IMPORT_PATH"
echo ""
echo "In the file picker, select the folder: dist"
echo "(Parent project: $EXT_ROOT)"

open -a Raycast

sleep 1

osascript <<EOF
tell application "Raycast" to activate
delay 0.8
tell application "System Events"
  tell process "Raycast"
    set frontmost to true
    -- Raycast Settings / Extensions: try common entry points
    try
      click menu item "Extensions" of menu "Window" of menu bar 1
    on error
      try
        keystroke "," using command down
        delay 0.6
      end try
    end try
  end tell
end tell
EOF

# Fallback: reveal dist in Finder so user can drag or pick quickly
open -R "$IMPORT_PATH"

echo ""
echo "If automation did not open Import, in Raycast go to:"
echo "  Settings → Extensions → + → Import Extension"
echo "Then choose: $IMPORT_PATH"

# TIME RULER - developer installer for macOS (unsigned panel)
# Usage:
#   sh install-dev-macos.sh              # install/refresh copy
#   sh install-dev-macos.sh --debug      # also enable PlayerDebugMode
#   sh install-dev-macos.sh --uninstall  # remove installed copy
#!/bin/sh
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/TIME_RULER"

if [ "$1" = "--uninstall" ]; then
    if [ -d "$DEST" ]; then
        rm -rf "$DEST"
        echo "Removed: $DEST"
    else
        echo "Nothing to remove at: $DEST"
    fi
    exit 0
fi

mkdir -p "$DEST"
for item in CSXS client host presets README.md CHANGELOG.md LICENSES.md; do
    if [ -e "$PROJECT_ROOT/$item" ]; then
        cp -R "$PROJECT_ROOT/$item" "$DEST/"
    else
        echo "WARNING: missing (skipped): $PROJECT_ROOT/$item"
    fi
done

if [ ! -f "$DEST/CSXS/manifest.xml" ]; then
    echo "ERROR: install incomplete: CSXS/manifest.xml not found in $DEST" >&2
    exit 1
fi

if [ "$1" = "--debug" ]; then
    # Unsigned extensions require PlayerDebugMode (development only).
    # AE 2023 ships CEP 11; AE 2024/2025 may ship CEP 12. Setting both is harmless.
    defaults write com.adobe.CSXS.11 PlayerDebugMode 1
    defaults write com.adobe.CSXS.12 PlayerDebugMode 1
    echo "PlayerDebugMode=1 written for CSXS.11 and CSXS.12"
fi

echo ""
echo "Installed to: $DEST"
echo "Next steps:"
echo "  1. Restart After Effects (fully quit and relaunch)."
echo "  2. Open the panel: Window > Extensions > TIME RULER."

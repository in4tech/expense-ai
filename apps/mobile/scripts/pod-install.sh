#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/../.." && pwd)"
cd "$ROOT/ios"

# Patches make podspecs work with CocoaPods < 1.13 (visionOS guard).
if [[ -f "$REPO_ROOT/scripts/apply-patches.cjs" ]]; then
  node "$REPO_ROOT/scripts/apply-patches.cjs"
fi

# CocoaPods >= 1.13 is required (visionOS in RN podspecs).
if [[ -x /opt/homebrew/bin/pod ]]; then
  export PATH="/opt/homebrew/bin:$PATH"
elif [[ -x /usr/local/bin/pod ]]; then
  export PATH="/usr/local/bin:$PATH"
fi

version="$(pod --version 2>/dev/null || echo 0)"
major="${version%%.*}"
minor_patch="${version#*.}"
minor="${minor_patch%%.*}"

if (( major < 1 || (major == 1 && minor < 13) )); then
  echo "error: CocoaPods >= 1.13 required (found ${version})." >&2
  echo "Install: brew install cocoapods" >&2
  echo "Or ensure Homebrew is before ~/.gem in PATH." >&2
  exit 1
fi

exec pod install "$@"

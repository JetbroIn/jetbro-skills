#!/usr/bin/env bash
# Verify the version is identical in all three places it appears:
#   .claude-plugin/plugin.json, .claude-plugin/marketplace.json, README.md
#
# The marketplace manifest has drifted before (it sat at 1.2.0 while the
# plugin manifest said 1.4.0), which is why this exists. Run it after any
# version bump. Exits non-zero on mismatch so CI can use it later.

set -euo pipefail
cd "$(dirname "$0")/.."

plugin=$(python3 -c "import json;print(json.load(open('.claude-plugin/plugin.json'))['version'])")
market=$(python3 -c "import json;print(json.load(open('.claude-plugin/marketplace.json'))['plugins'][0]['version'])")
readme=$(grep -m1 -oE '^\*\*v[0-9]+\.[0-9]+\.[0-9]+\*\*$' README.md | tr -d '*v' || true)

printf 'plugin.json      %s\n' "$plugin"
printf 'marketplace.json %s\n' "$market"
printf 'README.md        %s\n' "${readme:-<not found>}"

if [ "$plugin" = "$market" ] && [ "$plugin" = "$readme" ]; then
  echo "✔ versions in sync"
else
  echo "✘ version mismatch: update all three before releasing" >&2
  exit 1
fi

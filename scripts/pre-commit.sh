#!/usr/bin/env bash
# Pre-commit hook: block secrets from being committed
set -e

RED='\033[0;31m'
NC='\033[0m'

BLOCKED_PATTERNS=(
  "\.env$"
  ".*key\.json$"
  ".*token\.txt$"
  "seed_token\.txt"
  "sa-key\.json"
  "service-account.*\.json"
  "credentials\.json"
)

STAGED=$(git diff --cached --name-only)

for file in $STAGED; do
  for pattern in "${BLOCKED_PATTERNS[@]}"; do
    if echo "$file" | grep -Eq "$pattern"; then
      echo -e "${RED}BLOCKED: $file matches pattern $pattern${NC}"
      echo -e "${RED}  Use: git reset HEAD $file${NC}"
      exit 1
    fi
  done
done

exit 0

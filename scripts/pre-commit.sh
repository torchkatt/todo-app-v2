#!/usr/bin/env bash
# ─── Pre-commit hook: detect secrets before they reach GitHub ───
# Install: cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

set -euo pipefail

RED='\033[0;31m'
NC='\033[0m'

echo "🔍 Scanning for secrets..."

# Patterns that look like secrets
PATTERNS=(
  'AIzaSy[0-9A-Za-z_-]{25,}'
  'sk-[a-zA-Z0-9]{20,}'
  'ghp_[a-zA-Z0-9]{36}'
  'gho_[a-zA-Z0-9]{36}'
  'github_pat_[a-zA-Z0-9]{84}'
  '-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----'
)

for pattern in "${PATTERNS[@]}"; do
  if git diff --cached --diff-filter=ACMR | grep -qE "$pattern"; then
    echo -e "${RED}❌ SECRET DETECTED matching pattern: $pattern${NC}"
    echo "   Commit aborted. Remove the secret from staged files."
    exit 1
  fi
done

echo "✅ No secrets detected in staged files."

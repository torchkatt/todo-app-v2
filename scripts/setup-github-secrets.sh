#!/usr/bin/env bash
# ─── Setup GitHub Secrets for Todo CI/CD ───
# Requires: gh CLI (authenticated) + the service account key at ./todo-sa-key.json
# Run: bash scripts/setup-github-secrets.sh

set -e

REPO="$(git config --get remote.origin.url 2>/dev/null | sed 's/.*:\(.*\)\.git/\1/')"
if [ -z "$REPO" ]; then
  echo "❌ No git remote found. Push to GitHub first."
  echo "   git remote add origin https://github.com/YOUR_USER/todo-app.git"
  echo "   git push -u origin master"
  exit 1
fi

echo "🔐 Setting up secrets for $REPO..."

# Firebase service account (JSON key)
if [ -f todo-sa-key.json ]; then
  gh secret set FIREBASE_SERVICE_ACCOUNT --repo "$REPO" < todo-sa-key.json
  echo "  ✓ FIREBASE_SERVICE_ACCOUNT"
fi

# Firebase config (from .env)
if [ -f .env ]; then
  while IFS='=' read -r key value; do
    [ -z "$key" ] && continue
    gh secret set "$key" --repo "$REPO" --body "$value"
    echo "  ✓ $key"
  done < .env
fi

# Repository variables (non-sensitive config)
gh variable set VITE_FIREBASE_PROJECT_ID --repo "$REPO" --body "todo-a44f9"
gh variable set VITE_FIREBASE_AUTH_DOMAIN --repo "$REPO" --body "todo-a44f9.firebaseapp.com"
gh variable set VITE_FIREBASE_STORAGE_BUCKET --repo "$REPO" --body "todo-a44f9.firebasestorage.app"
gh variable set VITE_FIREBASE_MESSAGING_SENDER_ID --repo "$REPO" --body "741867785122"
gh variable set VITE_FIREBASE_APP_ID --repo "$REPO" --body "1:741867785122:web:18cf567bfb8efa689f40fb"
gh variable set VITE_FIREBASE_MEASUREMENT_ID --repo "$REPO" --body "G-P6RMQD1Y54"

echo ""
echo "✅ Secrets configured! Next push to master will auto-deploy:"
echo "   git push origin master"

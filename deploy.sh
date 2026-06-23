#!/bin/bash
# AquaMap Africa — GitHub Deployment Script
# Usage: GITHUB_TOKEN=your_token ./deploy.sh

TOKEN="${GITHUB_TOKEN:-}"
USERNAME="josuekongolo"
REPO="aquamap-africa"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: Set GITHUB_TOKEN environment variable"
  echo "Usage: GITHUB_TOKEN=ghp_... ./deploy.sh"
  exit 1
fi

echo "🐠 AquaMap Africa Deployment"
echo "================================"

# 1. Create GitHub repo
echo "📦 Creating GitHub repository..."
RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO\",\"description\":\"AquaMap Africa — Plateforme aquacole pour les opérateurs africains\",\"public\":true}")

REPO_URL=$(echo $RESPONSE | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('html_url',''))" 2>/dev/null)
if [ -z "$REPO_URL" ]; then
  echo "  Repo may already exist, continuing..."
fi

# 2. Build
echo "🔨 Building..."
npm run build

# 3. Push source
echo "📤 Pushing source code..."
git remote set-url origin "https://$USERNAME:$TOKEN@github.com/$USERNAME/$REPO.git"
git push -u origin main --force

# 4. Deploy gh-pages
echo "🌐 Deploying to GitHub Pages..."
npm run deploy

echo ""
echo "✅ Done! Your app should be live at:"
echo "   https://$USERNAME.github.io/$REPO"
echo ""
echo "Note: GitHub Pages may take 1-2 minutes to go live."

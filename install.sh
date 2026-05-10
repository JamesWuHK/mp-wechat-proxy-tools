#!/usr/bin/env sh
set -eu

REPO_URL=${1:-${MP_PROXY_REPO_URL:-}}
INSTALL_DIR=${MP_PROXY_INSTALL_DIR:-"$HOME/.mp-wechat-proxy"}

if [ -z "$REPO_URL" ]; then
  echo "Usage: install.sh <git-repo-url>" >&2
  echo "Or set MP_PROXY_REPO_URL=<git-repo-url>" >&2
  exit 2
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git is required" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js >= 18 is required" >&2
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Node.js >= 18 is required, found $(node -v)" >&2
  exit 1
fi

if [ -d "$INSTALL_DIR" ]; then
  BACKUP_DIR="$INSTALL_DIR.backup.$(date +%Y%m%d%H%M%S)"
  mv "$INSTALL_DIR" "$BACKUP_DIR"
  echo "Backed up existing install to $BACKUP_DIR"
fi

git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"

cd "$INSTALL_DIR"
node bin/mp-proxy.js setup
npm link >/dev/null 2>&1 || true

echo "Installed mp-wechat-proxy at $INSTALL_DIR"
echo "CLI path: $INSTALL_DIR/bin/mp-proxy.js"
if command -v mp-proxy >/dev/null 2>&1; then
  echo "Global command: mp-proxy"
else
  echo "Global command was not linked. Use: node $INSTALL_DIR/bin/mp-proxy.js"
fi

echo "Next steps:"
echo "1. Edit $INSTALL_DIR/.env"
echo "2. Put MP_AGENT_ID, MP_AGENT_KEY, and MP_AGENT_SIGNING_SECRET in $INSTALL_DIR/.env"
echo "3. Run: mp-proxy doctor && mp-proxy onboarding  OR  node $INSTALL_DIR/bin/mp-proxy.js doctor"

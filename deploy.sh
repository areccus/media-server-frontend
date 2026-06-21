#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TUNNEL_LOG=$(mktemp)

echo "Starting Cloudflare tunnel..."
cloudflared tunnel --url http://localhost:8090 > "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

# Wait up to 30s for the URL to appear
TUNNEL_URL=""
for i in $(seq 1 30); do
  TUNNEL_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" | head -1)
  [ -n "$TUNNEL_URL" ] && break
  sleep 1
done
rm -f "$TUNNEL_LOG"

if [ -z "$TUNNEL_URL" ]; then
  echo "❌ Failed to get tunnel URL — is cloudflared installed and localhost:5001 running?"
  kill $TUNNEL_PID 2>/dev/null
  exit 1
fi

echo "✅ Tunnel: $TUNNEL_URL"

cat > "$SCRIPT_DIR/vercel.json" << EOF
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "${TUNNEL_URL}/api/:path*" }
  ]
}
EOF

echo "Deploying to Vercel..."
cd "$SCRIPT_DIR" && vercel --prod

echo ""
echo "✅ Live! Keep this terminal open — closing it kills the tunnel."
wait $TUNNEL_PID

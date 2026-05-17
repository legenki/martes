#!/bin/bash
# Double-click to launch Martes locally.
cd "$(dirname "$0")"

PORT=8081

if lsof -i :$PORT -sTCP:LISTEN &>/dev/null; then
  echo "Port $PORT already in use — opening browser..."
  open "http://localhost:$PORT/"
  exit 0
fi

NODE=$(command -v node || command -v nodejs || ls /usr/local/bin/node 2>/dev/null | head -1)

if [ -n "$NODE" ]; then
  echo "✓ Starting Martes on http://localhost:$PORT"
  sleep 0.5 && open "http://localhost:$PORT/" &
  "$NODE" server.js
else
  echo "⚠ Node.js not found — falling back to Python's http.server."
  echo "  Install Node.js from https://nodejs.org for the default launcher."
  echo ""
  echo "✓ Starting Martes on http://localhost:$PORT"
  sleep 0.5 && open "http://localhost:$PORT/index.html" &
  python3 -m http.server $PORT 2>/dev/null || python -m SimpleHTTPServer $PORT
fi

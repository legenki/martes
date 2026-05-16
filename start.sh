#!/bin/sh
# Start Martes locally.
NODE=/opt/homebrew/bin/node
if [ ! -f "$NODE" ]; then
  NODE=$(which node 2>/dev/null)
fi
if [ -z "$NODE" ]; then
  echo "Node.js not found. Install via: brew install node"
  exit 1
fi
cd "$(dirname "$0")"
"$NODE" server.js &
sleep 0.5
open http://localhost:8080
wait

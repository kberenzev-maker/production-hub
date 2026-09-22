#!/bin/bash
# Persistent tunnel runner using localhost.run via SSH
while true; do
  echo "[Tunnel] Starting ssh tunnel to localhost.run on port 3000..."
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -R 80:localhost:3000 nokey@localhost.run
  echo "[Tunnel] Tunnel disconnected, restarting in 3 seconds..."
  sleep 3
done

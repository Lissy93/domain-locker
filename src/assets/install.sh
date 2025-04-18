#!/bin/bash
set -e

command -v docker >/dev/null || {
  echo "❌ Docker is not installed. Get it from https://docs.docker.com/get-docker/"
  exit 1
}

echo "📥 Downloading docker-compose.yml..."
curl -fsSL https://raw.githubusercontent.com/Lissy93/domain-locker/refs/heads/main/docker-compose.yml \
  -o docker-compose.yml || {
    echo "❌ Failed to download docker-compose.yml"
    exit 1
  }

echo "🚀 Starting Domain Locker..."
docker compose up --wait -d
docker compose logs -f --no-log-prefix

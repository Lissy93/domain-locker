#!/bin/bash
set -e

################################################################################
# Domain Locker - A self-hosted domain management tool                         #
#                                                                              #
# To install Domain Locker with Docker, download and execute this script       #
# Alternatively, download and use our docker-compose.yml as a template:        #
# https://github.com/Lissy93/domain-locker/blob/main/docker-compose.yml        #
#                                                                              #
# Domain Locker is licensed under the MIT License. (C) Alicia Sykes 2025       #
# View source on GitHub, at: https://github.com/Lissy93/domain-locker          #
################################################################################

# 1. Check Docker is installed
command -v docker >/dev/null || {
  echo "❌ Docker is not installed. Get it from https://docs.docker.com/get-docker/"
  exit 1
}

# 2. Download the docker-compose
echo "📥 Downloading docker-compose.yml..."
curl -fsSL https://raw.githubusercontent.com/Lissy93/domain-locker/HEAD/docker-compose.yml \
  -o docker-compose.yml || {
    echo "❌ Failed to download docker-compose.yml"
    exit 1
  }

# 3. Start docker compose, and print logs
echo "🚀 Starting Domain Locker..."
docker compose up --wait -d
docker compose logs -f --no-log-prefix

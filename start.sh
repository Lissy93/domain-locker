#!/bin/sh

# Let user skip all checks and initialization, if DL_SKIP_INIT env var is set
if [ -n "$DL_SKIP_INIT" ]; then
  echo "Skipping initialization, and starting app directly"
  exec node ./dist/analog/server/index.mjs
fi

# Skip checks if SUPABASE_URL and SUPABASE_ANON_KEY are set, or if DL_ENV_TYPE is 'managed'
if { [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_ANON_KEY" ]; } || [ "$DL_ENV_TYPE" = "managed" ]; then
  echo "Skipping initialization, as not self-hosted instance, or using Postgres"
  exec node ./dist/analog/server/index.mjs
fi

# ANSI color codes
ERR=$'\033[0;31m❌'
WARN=$'\033[1;33m⚠️'
SUCCESS=$'\033[0;32m✅'
INFO=$'\nℹ️ \033[90m'
RESET=$'\033[0m'

MAX_WAIT=600
WARNINGS_FOUND=0

echo "${INFO} Checking environment...${RESET}"

# Check psql and node are installed, and that the app is built
[ -x "$(command -v psql)" ] || {
  echo "${WARN} psql (Postgres client) not found in PATH${RESET}";
  WARNINGS_FOUND=1;
}
[ -x "$(command -v node)" ] || {
  echo "${WARN} node not found in PATH. Is it installed?${RESET}";
  WARNINGS_FOUND=1;
}
[ -f "./dist/analog/server/index.mjs" ] || {
  echo "${WARN} App entrypoint not found. Did you run the build?${RESET}";
  WARNINGS_FOUND=1;
}

# Check if in Docker
if [ ! -f /.dockerenv ]; then
  echo "${WARN} This doesn't appear to be a Docker container${RESET}"
fi

# Check required environment variables
REQUIRED_VARS="DL_PG_HOST DL_PG_PORT DL_PG_USER DL_PG_PASSWORD DL_PG_NAME"
for VAR in $REQUIRED_VARS; do
  if [ -z "$(eval echo \$$VAR)" ]; then
    echo "${WARN} Environment variable $VAR is not set${RESET}"
    WARNINGS_FOUND=1
  fi
done

# Success message if everything looks good
if [ "$WARNINGS_FOUND" -eq 0 ]; then
  echo "${SUCCESS} All environment checks have passed${RESET}"
else
  echo "${ERR} Unable to start app, as issues were found${RESET}"
  exit 1
fi

# Wait for Postgres to be ready
echo "${INFO} Waiting for Postgres at ${DL_PG_HOST}:${DL_PG_PORT}...${RESET}"
elapsed=0
while ! pg_isready -h "$DL_PG_HOST" -p "$DL_PG_PORT" -U "$DL_PG_USER" > /dev/null 2>&1; do
  sleep 1
  elapsed=$((elapsed + 1))
  if [ $((elapsed % 30)) -eq 0 ]; then
    echo "${WARN} Postgres doesn't appear to be ready yet, after ${elapsed}s. Still waiting...${RESET}"
  fi
  if [ "$elapsed" -ge "$MAX_WAIT" ]; then
    echo "${ERR} Postgres not ready after ${MAX_WAIT}s. Exiting.${RESET}"
    exit 1
  fi
done
echo "${SUCCESS} Postgres is ready (took ${elapsed}s)${RESET}"

# Check if schema is applied / and apply it
echo "${INFO} Applying schema from schema.sql...${RESET}"
PGPASSWORD="$DL_PG_PASSWORD" psql -h "$DL_PG_HOST" -p "$DL_PG_PORT" -U "$DL_PG_USER" \
  -d "$DL_PG_NAME" -f ./schema.sql > /dev/null 2>&1 \
  && echo "${SUCCESS} Schema applied successfully${RESET}" \
  || echo "${ERR} Failed to apply schema${RESET}"

# Testing the database connection
echo "${INFO} Testing database connection...${RESET}"
PGPASSWORD="$DL_PG_PASSWORD" psql -h "$DL_PG_HOST" -p "$DL_PG_PORT" -U "$DL_PG_USER" -d "$DL_PG_NAME" \
  -c "SELECT 1;" > /dev/null 2>&1 \
  && echo "${SUCCESS} Database connection test succeeded${RESET}" \
  || echo "${ERR} Database connection test failed${RESET}"

# Start the app!
echo "${INFO} Starting Domain Locker${RESET}"
exec node ./dist/analog/server/index.mjs

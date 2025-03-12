#!/bin/bash

# Exit immediately if a command fails
set -e

# Determine this script's directory (so we can locate schema.sql from anywhere).
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Configuration variables: Use environment variables if set, otherwise use defaults
DB_NAME="${DOMAIN_LOCKER_DB_NAME:-domain_locker}"
DB_USER="${DOMAIN_LOCKER_DB_USER:-postgres}"
DB_PASSWORD="${DOMAIN_LOCKER_DB_PASSWORD:-changeme2420}"
DB_HOST="${DOMAIN_LOCKER_DB_HOST:-localhost}"
DB_PORT="${DOMAIN_LOCKER_DB_PORT:-5432}"
# By default, assume schema.sql is in the same directory as this script
SCHEMA_FILE="${SCHEMA_FILE:-$SCRIPT_DIR/schema.sql}"

# Export PGPASSWORD for non-interactive password authentication
export PGPASSWORD="$DB_PASSWORD"

echo "-----------------------------------------"
echo "Starting PostgreSQL setup script..."
echo "Using the following configuration:"
echo "  Database Name:   $DB_NAME"
echo "  User:            $DB_USER"
echo "  Host:            $DB_HOST"
echo "  Port:            $DB_PORT"
echo "  Schema File:     $SCHEMA_FILE"
echo "-----------------------------------------"

# Step 1: Check connection to PostgreSQL
echo "Checking PostgreSQL connection to $DB_HOST:$DB_PORT..."
pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"
if [ $? -ne 0 ]; then
  echo "Error: Unable to connect to PostgreSQL at $DB_HOST:$DB_PORT"
  exit 1
fi

# Step 2: Create the database user (if it doesn't already exist)
echo "Creating database user $DB_USER if not exists..."
psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -c "DO \$\$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;"

# Step 3: Check if the database exists; create if it doesn't
echo "Checking if database $DB_NAME exists..."
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'")
if [[ "$DB_EXISTS" != "1" ]]; then
  echo "Creating database $DB_NAME..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
else
  echo "Database $DB_NAME already exists. Skipping creation."
fi

# Step 4: Grant privileges to the user
echo "Granting ALL PRIVILEGES on database $DB_NAME to $DB_USER..."
psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Step 5: Apply the schema
if [ -f "$SCHEMA_FILE" ]; then
  echo "Applying schema from $SCHEMA_FILE to the database..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_FILE"
else
  echo "Schema file not found at $SCHEMA_FILE. Skipping schema application."
fi

# Unset PGPASSWORD after the script completes
unset PGPASSWORD

echo "-----------------------------------------"
echo "Database setup complete!"
echo "-----------------------------------------"

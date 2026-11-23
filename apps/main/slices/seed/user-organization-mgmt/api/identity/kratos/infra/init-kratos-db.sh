#!/usr/bin/env bash
# Creates the `kratos` database on the shared Postgres instance. Runs as a
# one-shot compose service because initdb scripts don't run on an existing
# pg-data volume. Idempotent.
set -euo pipefail

until pg_isready -h "$PGHOST" -U "$PGUSER" >/dev/null 2>&1; do
  echo "waiting for postgres..."
  sleep 1
done

if psql -h "$PGHOST" -U "$PGUSER" -tAc "SELECT 1 FROM pg_database WHERE datname = 'kratos'" | grep -q 1; then
  echo "kratos database already exists"
else
  psql -h "$PGHOST" -U "$PGUSER" -c 'CREATE DATABASE kratos'
  echo "kratos database created"
fi

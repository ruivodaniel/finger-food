#!/bin/bash
set -e

echo "=== Prowd Setup ==="
echo ""

# 1. Start infrastructure (Postgres, Maildev, LocalStack)
echo "Starting Docker services..."
docker compose -f apps/main/shared/api/docker-compose.yml up -d --wait
echo "✓ Docker services running"
echo ""

# 2. Run migrations + seed
echo "Running database migrations and seed..."
pnpm --dir apps/main/shared/api run db:seed -- -y
echo "✓ Database ready"
echo ""

echo "=== Setup complete ==="
echo ""
echo "  Postgres:   localhost:5433"
echo "  Maildev UI: http://localhost:1080"
echo "  LocalStack: http://localhost:4566"
echo ""
echo "Next steps:"
echo "  pnpm run dev:api       # API server  → http://localhost:3000"
echo "  pnpm run dev:web-main  # Web app     → http://localhost:5174"
echo ""

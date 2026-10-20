#!/usr/bin/env bash
set -euo pipefail

# Generate backend.hcl from the example template for a new project.
# Usage: ./scripts/init-backend.sh <project-name>
#
# This creates terraform/deployment/backend.hcl with the correct state key
# for the project. Run once when setting up a new project from the seed.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/terraform/deployment"
BACKEND_FILE="$BACKEND_DIR/backend.hcl"
EXAMPLE_FILE="$BACKEND_DIR/backend.hcl.example"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <project-name>"
  echo ""
  echo "Example: $0 my-project"
  echo "  → state key: terraform/my-project/deployment.tfstate"
  exit 1
fi

PROJECT_NAME="$1"

if [[ ! "$PROJECT_NAME" =~ ^[a-zA-Z0-9-]+$ ]]; then
  echo "Error: project name must contain only alphanumeric characters and hyphens"
  exit 1
fi

if [[ -f "$BACKEND_FILE" ]]; then
  echo "⚠️  $BACKEND_FILE already exists:"
  cat "$BACKEND_FILE"
  echo ""
  read -rp "Overwrite? (y/N) " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 0
  fi
fi

sed "s/<PROJECT_NAME>/$PROJECT_NAME/" "$EXAMPLE_FILE" > "$BACKEND_FILE"

echo "✅ Created $BACKEND_FILE"
echo ""
cat "$BACKEND_FILE"
echo ""
echo "Next: cd terraform/deployment && terraform init -backend-config=backend.hcl"

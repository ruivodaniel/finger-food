#!/usr/bin/env bash
set -euo pipefail

# Fetch VITE_* secrets from AWS Secrets Manager and write to .env
# Called by continuous-deployment.yml before Docker build

TERRAFORM_SECRET_ID="${SECRET_PREFIX}/terraform"
MANUAL_SECRET_ID="${SECRET_PREFIX}/secrets"

secret_json=$(aws secretsmanager get-secret-value \
  --secret-id "$TERRAFORM_SECRET_ID" \
  --query SecretString \
  --output text \
  --region "${AWS_REGION:-eu-west-1}")

terraform_json=$(aws secretsmanager get-secret-value \
  --secret-id "$MANUAL_SECRET_ID" \
  --query SecretString \
  --output text \
  --region "${AWS_REGION:-eu-west-1}")

merged_json=$(jq -s '.[0] * .[1]' \
  <(echo "$secret_json") \
  <(echo "$terraform_json"))

echo "$merged_json" | \
  jq -r 'to_entries[] | select(.key | startswith("VITE_")) | "\(.key)=\(.value)"' \
  > .env

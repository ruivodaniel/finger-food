#!/bin/bash

set -euo pipefail

export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test"
export AWS_DEFAULT_REGION="us-east-1"

echo "Creating bucket: $AWS_BUCKET_NAME"
awslocal s3 mb s3://$AWS_BUCKET_NAME || true

echo "Applying public-read bucket policy..."
awslocal s3api put-bucket-policy --bucket "$AWS_BUCKET_NAME" --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'"$AWS_BUCKET_NAME"'/*"
    }
  ]
}'

echo "Applying permissive CORS policy..."
awslocal s3api put-bucket-cors --bucket "$AWS_BUCKET_NAME" --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD", "PUT", "POST"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": [],
      "MaxAgeSeconds": 3000
    }
  ]
}'

echo "Listing contents:"
awslocal s3 ls s3://$AWS_BUCKET_NAME

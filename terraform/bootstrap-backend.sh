#!/bin/bash

# Bootstrap script to create S3 bucket and DynamoDB table for Terraform remote state
# Run this ONCE before setting up remote state

set -e

# Configuration - customize these
BUCKET_NAME="${1:-terraform-state-chat-app-$(openssl rand -hex 4)}"
REGION="${2:-us-east-1}"
DYNAMODB_TABLE="terraform-state-lock"

echo "🚀 Bootstrapping Terraform remote state backend..."
echo "Bucket name: $BUCKET_NAME"
echo "Region: $REGION"
echo "DynamoDB table: $DYNAMODB_TABLE"
echo ""

# Check if bucket already exists
if aws s3 ls "s3://$BUCKET_NAME" 2>/dev/null; then
    echo "⚠️  Bucket $BUCKET_NAME already exists"
else
    echo "Creating S3 bucket: $BUCKET_NAME"
    if [ "$REGION" == "us-east-1" ]; then
        # us-east-1 doesn't need LocationConstraint
        aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION"
    else
        aws s3api create-bucket \
            --bucket "$BUCKET_NAME" \
            --region "$REGION" \
            --create-bucket-configuration LocationConstraint="$REGION"
    fi
    
    # Enable versioning
    echo "Enabling versioning on bucket"
    aws s3api put-bucket-versioning \
        --bucket "$BUCKET_NAME" \
        --versioning-configuration Status=Enabled
    
    # Enable encryption
    echo "Enabling encryption on bucket"
    aws s3api put-bucket-encryption \
        --bucket "$BUCKET_NAME" \
        --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }'
    
    # Block public access
    echo "Blocking public access"
    aws s3api put-public-access-block \
        --bucket "$BUCKET_NAME" \
        --public-access-block-configuration \
            "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
fi

# Check if DynamoDB table already exists
if aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$REGION" 2>/dev/null; then
    echo "DynamoDB table $DYNAMODB_TABLE already exists"
else
    echo "🗄️  Creating DynamoDB table: $DYNAMODB_TABLE"
    aws dynamodb create-table \
        --table-name "$DYNAMODB_TABLE" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "$REGION"
    
    echo "⏳ Waiting for table to be active..."
    aws dynamodb wait table-exists --table-name "$DYNAMODB_TABLE" --region "$REGION"
fi

echo ""
echo "✅ Bootstrap complete!"
echo ""
echo "Next steps:"
echo "1. Create backend.tf with these values:"
echo "   bucket         = \"$BUCKET_NAME\""
echo "   key            = \"chat-app/terraform.tfstate\""
echo "   region         = \"$REGION\""
echo "   dynamodb_table = \"$DYNAMODB_TABLE\""
echo ""
echo "2. Run: terraform init -migrate-state"
echo "3. Verify: terraform plan (should show no changes)"


#!/bin/bash

# AWS Serverless Chat - Frontend Deployment Script
# This script deploys the frontend to S3 + CloudFront

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/terraform"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
AWS_REGION="${AWS_REGION:-us-east-1}"
PROJECT_NAME="${PROJECT_NAME:-chat-app}"

# Generate unique bucket name (S3 bucket names must be globally unique)
TIMESTAMP=$(date +%s)
BUCKET_NAME="${BUCKET_NAME:-${PROJECT_NAME}-frontend-${TIMESTAMP}}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}AWS Serverless Chat - Frontend Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

command -v aws >/dev/null 2>&1 || { echo -e "${RED}Error: AWS CLI is not installed.${NC}" >&2; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo -e "${RED}Error: Terraform is not installed.${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}Error: npm is not installed.${NC}" >&2; exit 1; }

# Check AWS credentials
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}Error: AWS credentials not configured. Run 'aws configure'${NC}" >&2
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Step 1: Get WebSocket URL from Terraform
echo -e "${YELLOW}Step 1: Getting WebSocket URL from Terraform...${NC}"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo -e "${RED}Error: Terraform directory not found at $TERRAFORM_DIR${NC}" >&2
    exit 1
fi

cd "$TERRAFORM_DIR"

# Check if Terraform is initialized
if [ ! -d ".terraform" ]; then
    echo -e "${YELLOW}Terraform not initialized. Running terraform init...${NC}"
    terraform init
fi

# Get WebSocket URL
WEBSOCKET_URL=$(terraform output -raw stage_url 2>/dev/null || echo "")

if [ -z "$WEBSOCKET_URL" ]; then
    echo -e "${RED}Error: Could not get WebSocket URL from Terraform.${NC}"
    echo -e "${YELLOW}Make sure you've run 'terraform apply' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ WebSocket URL: $WEBSOCKET_URL${NC}"
echo ""

# Step 2: Build frontend
echo -e "${YELLOW}Step 2: Building frontend...${NC}"

cd "$FRONTEND_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Create .env.local with WebSocket URL
echo "VITE_WEBSOCKET_URL=$WEBSOCKET_URL" > .env.local
echo -e "${GREEN}✓ Created .env.local with WebSocket URL${NC}"

# Build the frontend
echo -e "${YELLOW}Building React app...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Build failed - dist directory not found${NC}" >&2
    exit 1
fi

echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

# Step 3: Create S3 bucket
echo -e "${YELLOW}Step 3: Setting up S3 bucket...${NC}"

# Check if bucket already exists
if aws s3 ls "s3://$BUCKET_NAME" 2>/dev/null; then
    echo -e "${YELLOW}Bucket $BUCKET_NAME already exists${NC}"
else
    echo -e "${YELLOW}Creating S3 bucket: $BUCKET_NAME${NC}"
    aws s3 mb "s3://$BUCKET_NAME" --region "$AWS_REGION"
    echo -e "${GREEN}✓ Bucket created${NC}"
fi

# Enable static website hosting
echo -e "${YELLOW}Configuring static website hosting...${NC}"
aws s3 website "s3://$BUCKET_NAME" \
    --index-document index.html \
    --error-document index.html

# Remove block public access
echo -e "${YELLOW}Configuring public access...${NC}"
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Set bucket policy for public read access
echo -e "${YELLOW}Setting bucket policy...${NC}"
cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file:///tmp/bucket-policy.json
rm /tmp/bucket-policy.json

echo -e "${GREEN}✓ S3 bucket configured${NC}"
echo ""

# Step 4: Upload files to S3
echo -e "${YELLOW}Step 4: Uploading files to S3...${NC}"
aws s3 sync "$FRONTEND_DIR/dist" "s3://$BUCKET_NAME" --delete
echo -e "${GREEN}✓ Files uploaded${NC}"
echo ""

# Step 5: Create/Update CloudFront distribution
echo -e "${YELLOW}Step 5: Setting up CloudFront distribution...${NC}"

# Check if distribution already exists
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='$PROJECT_NAME-frontend'].Id" --output text 2>/dev/null || echo "")

if [ -z "$DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}Creating CloudFront distribution...${NC}"
    
    # Get the S3 website endpoint
    S3_WEBSITE_ENDPOINT="$BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com"
    
    # Create distribution config
    cat > /tmp/cloudfront-config.json <<EOF
{
  "CallerReference": "$PROJECT_NAME-frontend-$(date +%s)",
  "Comment": "$PROJECT_NAME-frontend",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-$BUCKET_NAME",
        "DomainName": "$S3_WEBSITE_ENDPOINT",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only",
          "OriginSslProtocols": {
            "Quantity": 1,
            "Items": ["TLSv1.2"]
          }
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$BUCKET_NAME",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 7,
      "Items": ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "Enabled": true,
  "PriceClass": "PriceClass_100"
}
EOF

    DISTRIBUTION_OUTPUT=$(aws cloudfront create-distribution --distribution-config file:///tmp/cloudfront-config.json)
    DISTRIBUTION_ID=$(echo "$DISTRIBUTION_OUTPUT" | grep -o '"Id": "[^"]*' | cut -d'"' -f4)
    
    # Extract domain name from creation response (more reliable than separate API call)
    CLOUDFRONT_DOMAIN=$(echo "$DISTRIBUTION_OUTPUT" | grep -o '"DomainName": "[^"]*' | cut -d'"' -f4)
    
    rm /tmp/cloudfront-config.json
    
    echo -e "${GREEN}✓ CloudFront distribution created: $DISTRIBUTION_ID${NC}"
    echo -e "${YELLOW}Note: CloudFront distribution takes 15-20 minutes to deploy${NC}"
    NEW_DISTRIBUTION=true
else
    echo -e "${YELLOW}CloudFront distribution already exists: $DISTRIBUTION_ID${NC}"
    NEW_DISTRIBUTION=false
    
    # Invalidate cache
    echo -e "${YELLOW}Invalidating CloudFront cache...${NC}"
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text 2>/dev/null || echo "")
    if [ -n "$INVALIDATION_ID" ]; then
        echo -e "${GREEN}✓ Cache invalidation created: $INVALIDATION_ID${NC}"
    fi
    
    # Get CloudFront domain name (for existing distributions)
    CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" \
        --query 'Distribution.DomainName' \
        --output text 2>/dev/null || echo "")
fi

# If we don't have domain name yet, try to get it
if [ -z "$CLOUDFRONT_DOMAIN" ]; then
    echo -e "${YELLOW}Waiting for distribution to be available...${NC}"
    sleep 5
    CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" \
        --query 'Distribution.DomainName' \
        --output text 2>/dev/null || echo "")
fi

# If still no domain, use a placeholder
if [ -z "$CLOUDFRONT_DOMAIN" ]; then
    CLOUDFRONT_DOMAIN="d[distribution-id].cloudfront.net (check AWS Console)"
    echo -e "${YELLOW}Warning: Could not retrieve CloudFront domain name yet${NC}"
    echo -e "${YELLOW}Distribution is still deploying. Check AWS Console for the domain name.${NC}"
fi

echo ""

# Step 6: Configure error pages for React Router
echo -e "${YELLOW}Step 6: Configuring error pages for React Router...${NC}"

# Try to get distribution config (may fail if distribution is still deploying)
if aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" > /tmp/dist-config.json 2>/dev/null; then
    # Check if custom error responses already exist
    if ! grep -q "CustomErrorResponses" /tmp/dist-config.json || ! grep -q "ErrorCachingMinTTL" /tmp/dist-config.json; then
        echo -e "${YELLOW}Custom error responses not configured yet${NC}"
        echo -e "${YELLOW}Run ./configure-cloudfront-errors.sh after distribution is deployed${NC}"
        echo -e "${YELLOW}Or configure manually in AWS Console:${NC}"
        echo -e "${YELLOW}  CloudFront → $DISTRIBUTION_ID → Error Pages tab${NC}"
        echo -e "${YELLOW}  Add custom error response: 403 → /index.html → 200${NC}"
        echo -e "${YELLOW}  Add custom error response: 404 → /index.html → 200${NC}"
    else
        echo -e "${GREEN}✓ Error pages already configured${NC}"
    fi
    rm /tmp/dist-config.json
else
    echo -e "${YELLOW}Distribution is still deploying. Error pages can be configured later.${NC}"
    echo -e "${YELLOW}Run ./configure-cloudfront-errors.sh after distribution is ready${NC}"
fi

echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "S3 Bucket:        ${BLUE}$BUCKET_NAME${NC}"
echo -e "S3 Website URL:   ${BLUE}http://$BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com${NC}"
echo -e "CloudFront ID:    ${BLUE}$DISTRIBUTION_ID${NC}"
echo -e "CloudFront URL:   ${BLUE}https://$CLOUDFRONT_DOMAIN${NC}"
echo -e "WebSocket URL:    ${BLUE}$WEBSOCKET_URL${NC}"
echo ""
echo -e "${YELLOW}Important Notes:${NC}"
echo -e "1. CloudFront distribution takes 15-20 minutes to fully deploy"
echo -e "2. Configure error pages in CloudFront Console for React Router support"
echo -e "3. Your live URL will be: ${GREEN}https://$CLOUDFRONT_DOMAIN${NC}"
echo ""
echo -e "${GREEN}Deployment complete!${NC}"


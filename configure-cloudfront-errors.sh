#!/bin/bash

# Helper script to configure CloudFront error pages for React Router
# This script updates the CloudFront distribution to return index.html for 403/404 errors

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_NAME="${PROJECT_NAME:-chat-app}"

echo -e "${BLUE}Configuring CloudFront Error Pages for React Router${NC}"
echo ""

# Check for jq
if ! command -v jq >/dev/null 2>&1; then
    echo -e "${YELLOW}Warning: jq is not installed.${NC}"
    echo -e "${YELLOW}This script requires jq for JSON parsing.${NC}"
    echo ""
    echo -e "${YELLOW}To install jq:${NC}"
    echo -e "  macOS:   brew install jq"
    echo -e "  Linux:   sudo apt-get install jq"
    echo ""
    echo -e "${YELLOW}Alternatively, configure error pages manually:${NC}"
    echo -e "  1. Go to AWS Console → CloudFront"
    echo -e "  2. Select your distribution"
    echo -e "  3. Go to 'Error Pages' tab"
    echo -e "  4. Create custom error response:"
    echo -e "     - HTTP Error Code: 403"
    echo -e "     - Response Page Path: /index.html"
    echo -e "     - HTTP Response Code: 200"
    echo -e "  5. Repeat for 404"
    echo ""
    exit 1
fi

# Find distribution
echo -e "${YELLOW}Finding CloudFront distribution...${NC}"
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Comment=='$PROJECT_NAME-frontend'].Id" \
    --output text 2>/dev/null || echo "")

if [ -z "$DISTRIBUTION_ID" ]; then
    echo -e "${RED}Error: Could not find CloudFront distribution${NC}"
    echo -e "${YELLOW}Make sure you've run deploy-frontend.sh first${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found distribution: $DISTRIBUTION_ID${NC}"
echo ""

# Get current distribution config
echo -e "${YELLOW}Fetching current distribution configuration...${NC}"
aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" > /tmp/dist-config.json

ETAG=$(jq -r '.ETag' /tmp/dist-config.json)
CONFIG=$(jq -r '.DistributionConfig' /tmp/dist-config.json)

# Check if custom error responses already exist
HAS_CUSTOM_ERRORS=$(echo "$CONFIG" | jq -e '.CustomErrorResponses.Quantity > 0' 2>/dev/null || echo "false")

if [ "$HAS_CUSTOM_ERRORS" = "true" ]; then
    echo -e "${YELLOW}Custom error responses already exist. Updating...${NC}"
    
    # Update existing custom error responses
    UPDATED_CONFIG=$(echo "$CONFIG" | jq '
        .CustomErrorResponses = {
            "Quantity": 2,
            "Items": [
                {
                    "ErrorCode": 403,
                    "ResponsePagePath": "/index.html",
                    "ResponseCode": "200",
                    "ErrorCachingMinTTL": 300
                },
                {
                    "ErrorCode": 404,
                    "ResponsePagePath": "/index.html",
                    "ResponseCode": "200",
                    "ErrorCachingMinTTL": 300
                }
            ]
        }
    ')
else
    echo -e "${YELLOW}Adding custom error responses...${NC}"
    
    # Add custom error responses
    UPDATED_CONFIG=$(echo "$CONFIG" | jq '
        .CustomErrorResponses = {
            "Quantity": 2,
            "Items": [
                {
                    "ErrorCode": 403,
                    "ResponsePagePath": "/index.html",
                    "ResponseCode": "200",
                    "ErrorCachingMinTTL": 300
                },
                {
                    "ErrorCode": 404,
                    "ResponsePagePath": "/index.html",
                    "ResponseCode": "200",
                    "ErrorCachingMinTTL": 300
                }
            ]
        }
    ')
fi

# Save updated config
echo "$UPDATED_CONFIG" > /tmp/updated-config.json

# Update distribution
echo -e "${YELLOW}Updating CloudFront distribution...${NC}"
echo -e "${YELLOW}Note: This may take a few minutes...${NC}"

aws cloudfront update-distribution \
    --id "$DISTRIBUTION_ID" \
    --if-match "$ETAG" \
    --distribution-config file:///tmp/updated-config.json > /tmp/update-result.json

NEW_ETAG=$(jq -r '.ETag' /tmp/update-result.json)

echo -e "${GREEN}✓ Distribution update initiated${NC}"
echo ""
echo -e "${YELLOW}Distribution Status:${NC}"
STATUS=$(jq -r '.Distribution.Status' /tmp/update-result.json)
echo -e "  Status: $STATUS"

# Cleanup
rm -f /tmp/dist-config.json /tmp/updated-config.json /tmp/update-result.json

echo ""
echo -e "${GREEN}✓ Error pages configured!${NC}"
echo ""
echo -e "${YELLOW}Note: CloudFront changes take 15-20 minutes to deploy${NC}"
echo -e "${YELLOW}Check status with: aws cloudfront get-distribution --id $DISTRIBUTION_ID${NC}"


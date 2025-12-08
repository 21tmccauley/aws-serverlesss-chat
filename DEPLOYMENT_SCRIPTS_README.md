# Deployment Scripts

This directory contains automated scripts for deploying the frontend to AWS.

## Quick Start

### Prerequisites
- AWS CLI installed and configured (`aws configure`)
- Terraform installed
- Backend deployed (`cd terraform && terraform apply`)

### Deploy Everything

```bash
# 1. Deploy backend (if not already done)
cd terraform
terraform apply

# 2. Deploy frontend
cd ..
./deploy-frontend.sh
```

That's it! The script will:
- Get your WebSocket URL from Terraform
- Build the frontend
- Create S3 bucket
- Upload files
- Create CloudFront distribution
- Give you the live URL

### Configure React Router Support

After deployment, run:

```bash
./configure-cloudfront-errors.sh
```

This configures CloudFront to return `index.html` for 403/404 errors, which is required for React Router client-side routing.

## Scripts

### `deploy-frontend.sh`

Main deployment script that handles the entire frontend deployment process.

**What it does:**
1. Checks prerequisites (AWS CLI, Terraform, npm)
2. Gets WebSocket URL from Terraform outputs
3. Builds the frontend with the WebSocket URL
4. Creates/updates S3 bucket
5. Configures S3 for static website hosting
6. Sets bucket policies for public access
7. Uploads built files to S3
8. Creates/updates CloudFront distribution
9. Provides deployment summary

**Usage:**
```bash
./deploy-frontend.sh
```

**Environment Variables (optional):**
- `AWS_REGION` - AWS region (default: `us-east-1`)
- `PROJECT_NAME` - Project name (default: `chat-app`)
- `BUCKET_NAME` - Custom S3 bucket name (default: auto-generated)

**Example:**
```bash
AWS_REGION=us-west-2 PROJECT_NAME=my-chat ./deploy-frontend.sh
```

### `configure-cloudfront-errors.sh`

Configures CloudFront error pages for React Router support.

**What it does:**
1. Finds your CloudFront distribution
2. Adds/updates custom error responses:
   - 403 → `/index.html` with 200 status
   - 404 → `/index.html` with 200 status

**Usage:**
```bash
./configure-cloudfront-errors.sh
```

**Note:** Requires `jq` to be installed. If not available, you can configure error pages manually in the AWS Console.

**Manual Configuration:**
If the script doesn't work, configure manually:
1. Go to AWS Console → CloudFront
2. Select your distribution
3. Go to "Error Pages" tab
4. Create custom error response:
   - HTTP Error Code: `403`
   - Response Page Path: `/index.html`
   - HTTP Response Code: `200`
5. Repeat for `404`

## Troubleshooting

### Script fails with "AWS credentials not configured"
```bash
aws configure
```

### Script fails with "Terraform not initialized"
```bash
cd terraform
terraform init
terraform apply
```

### Script fails with "Could not get WebSocket URL"
Make sure you've deployed the backend:
```bash
cd terraform
terraform apply
terraform output stage_url  # Should show your WebSocket URL
```

### CloudFront distribution not found
The script looks for distributions with comment matching `$PROJECT_NAME-frontend`. If you created the distribution manually, you may need to update the script or set a custom `PROJECT_NAME`.

### Error pages script requires jq
Install jq:
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq

# Or configure manually in AWS Console
```

## Updating After Changes

To update the frontend after making changes:

```bash
# Just run the deployment script again
./deploy-frontend.sh
```

The script will:
- Rebuild the frontend
- Upload new files to S3
- Invalidate CloudFront cache (if distribution exists)

## Cleanup

To remove all resources:

```bash
# Delete CloudFront distribution (via AWS Console or CLI)
aws cloudfront list-distributions
aws cloudfront delete-distribution --id <distribution-id> --if-match <etag>

# Delete S3 bucket
aws s3 rb s3://your-bucket-name --force

# Delete backend (Terraform)
cd terraform
terraform destroy
```

## Architecture

```
User's Browser
    ↓
CloudFront (CDN)
    ↓
S3 Bucket (Static Files)
    ↓
React App loads in browser
    ↓
JavaScript creates WebSocket connection
    ↓
API Gateway WebSocket API (direct connection, bypasses CloudFront)
```

**Key Point:** CloudFront only serves static files. WebSocket connections go directly from the browser to API Gateway.


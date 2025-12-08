# Live Demo Deployment Guide

This guide will walk you through deploying your AWS serverless chat application so your classmates can access it via a URL.

## Overview

You need to:
1. **Deploy the backend** (AWS infrastructure via Terraform)
2. **Deploy the frontend** (to a hosting service)
3. **Configure the frontend** with your WebSocket URL

---

## Part 1: Deploy Backend Infrastructure

### Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured:
   ```bash
   aws configure
   ```
   Enter your AWS Access Key ID, Secret Access Key, and region (e.g., `us-east-1`)

3. **Terraform** installed:
   ```bash
   # macOS
   brew install terraform
   
   # Or download from https://www.terraform.io/downloads
   ```

### Deploy Steps

1. **Navigate to terraform directory:**
   ```bash
   cd terraform
   ```

2. **Initialize Terraform:**
   ```bash
   terraform init
   ```

3. **Review what will be created:**
   ```bash
   terraform plan
   ```
   This shows all resources that will be created (DynamoDB tables, Lambda functions, API Gateway, etc.)

4. **Deploy the infrastructure:**
   ```bash
   terraform apply
   ```
   Type `yes` when prompted. This will take a few minutes.

5. **Get your WebSocket URL:**
   ```bash
   terraform output stage_url
   ```
   
   You should see something like:
   ```
   wss://abc123xyz.execute-api.us-east-1.amazonaws.com/dev
   ```
   
   **Save this URL** - you'll need it for the frontend!

6. **Optional: Get all outputs:**
   ```bash
   terraform output
   ```

---

## Part 2: Deploy Frontend

You have several options for hosting the frontend. Choose one:

### Option A: Vercel (Recommended - Easiest)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

3. **Create environment file:**
   ```bash
   # Create .env.local file
   echo "VITE_WEBSOCKET_URL=wss://your-api-id.execute-api.us-east-1.amazonaws.com/dev" > .env.local
   ```
   Replace `wss://your-api-id...` with the URL from `terraform output stage_url`

4. **Deploy to Vercel:**
   ```bash
   vercel
   ```
   - Follow the prompts (login if needed)
   - Accept defaults for most questions
   - When asked about environment variables, you can add `VITE_WEBSOCKET_URL` or do it later in the dashboard

5. **Add environment variable in Vercel Dashboard:**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add: `VITE_WEBSOCKET_URL` = `wss://your-api-id.execute-api.us-east-1.amazonaws.com/dev`
   - Redeploy if needed

6. **Get your live URL:**
   Vercel will give you a URL like `https://your-project.vercel.app`

### Option B: Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

3. **Build the frontend:**
   ```bash
   npm run build
   ```

4. **Deploy:**
   ```bash
   netlify deploy --prod
   ```
   - Login if needed
   - Follow prompts

5. **Add environment variable:**
   - Go to https://app.netlify.com
   - Select your site → Site settings → Environment variables
   - Add: `VITE_WEBSOCKET_URL` = `wss://your-api-id.execute-api.us-east-1.amazonaws.com/dev`
   - Redeploy

### Option C: AWS S3 + CloudFront (Automated Script - Recommended)

**Use the automated deployment script:**

1. **Make sure backend is deployed:**
   ```bash
   cd terraform
   terraform apply
   ```

2. **Run the deployment script:**
   ```bash
   cd ..
   ./deploy-frontend.sh
   ```

   This script will:
   - Get WebSocket URL from Terraform automatically
   - Build the frontend with the correct WebSocket URL
   - Create and configure S3 bucket
   - Upload files to S3
   - Create CloudFront distribution
   - Provide you with the live URL

3. **Configure React Router support (one-time):**
   ```bash
   ./configure-cloudfront-errors.sh
   ```
   
   Or manually in AWS Console:
   - CloudFront → Your distribution → Error Pages
   - Add custom error response: 403 → `/index.html` → 200
   - Add custom error response: 404 → `/index.html` → 200

4. **Wait for CloudFront deployment** (~15-20 minutes)

5. **Access your site:**
   The script will output your CloudFront URL: `https://d1234567890abc.cloudfront.net`

### Option C (Manual): AWS S3 + CloudFront (Step-by-step)

If you prefer manual setup:

1. **Build the frontend:**
   ```bash
   cd frontend
   # Create .env.local with WebSocket URL from terraform output
   echo "VITE_WEBSOCKET_URL=wss://your-api-id.execute-api.us-east-1.amazonaws.com/dev" > .env.local
   npm run build
   ```

2. **Create S3 bucket:**
   ```bash
   aws s3 mb s3://your-chat-app-frontend --region us-east-1
   ```

3. **Enable static website hosting:**
   ```bash
   aws s3 website s3://your-chat-app-frontend \
     --index-document index.html \
     --error-document index.html
   ```

4. **Upload files:**
   ```bash
   aws s3 sync dist/ s3://your-chat-app-frontend --delete
   ```

5. **Make bucket public:**
   - Go to AWS Console → S3 → your bucket → Permissions
   - Edit Block public access → Uncheck all → Save
   - Edit Bucket policy → Add:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-chat-app-frontend/*"
       }
     ]
   }
   ```

6. **Create CloudFront distribution:**
   - AWS Console → CloudFront → Create distribution
   - Origin: `your-chat-app-frontend.s3-website-us-east-1.amazonaws.com`
   - Default root object: `index.html`
   - Add custom error responses: 403 and 404 → `/index.html` → 200
   - Create distribution (takes ~15 minutes)

---

## Part 3: Configure Frontend Environment Variable

If you haven't already set the environment variable during deployment:

### For Vite (Vercel/Netlify):

The environment variable must be set **before building**. It's prefixed with `VITE_` so Vite includes it in the bundle.

**Option 1: Set in hosting platform dashboard** (recommended)
- Vercel: Settings → Environment Variables
- Netlify: Site settings → Environment variables
- Add: `VITE_WEBSOCKET_URL` = `wss://your-api-id.execute-api.us-east-1.amazonaws.com/dev`
- Redeploy

**Option 2: Create `.env.local` file** (for local builds)
```bash
cd frontend
echo "VITE_WEBSOCKET_URL=wss://your-api-id.execute-api.us-east-1.amazonaws.com/dev" > .env.local
```

---

## Part 4: Test Your Live Demo

1. **Open your frontend URL** in a browser
2. **Enter a username** when prompted
3. **Open the same URL in another browser/incognito window** (or share with a classmate)
4. **Enter a different username**
5. **Send messages** - they should appear in both windows in real-time!

---

## Troubleshooting

### Frontend can't connect to WebSocket

1. **Check the WebSocket URL:**
   ```bash
   cd terraform
   terraform output stage_url
   ```

2. **Verify environment variable is set:**
   - Check your hosting platform's environment variables
   - Make sure it starts with `wss://` (not `ws://` or `https://`)

3. **Check CORS/API Gateway:**
   - WebSocket APIs don't have CORS issues, but verify the API Gateway stage is deployed

### Messages not appearing

1. **Check CloudWatch Logs:**
   - AWS Console → CloudWatch → Log groups
   - Look for `/aws/lambda/chat-app-sendMessage` and `/aws/lambda/chat-app-onConnect`

2. **Verify DynamoDB tables exist:**
   - AWS Console → DynamoDB → Tables
   - Should see `chat-app-connections` and `chat-app-messages`

### Frontend shows "WebSocket URL is not configured"

- The `VITE_WEBSOCKET_URL` environment variable is missing
- Set it in your hosting platform and redeploy
- For Vite, environment variables must be prefixed with `VITE_` and set at build time

---

## Cost Estimate

- **API Gateway WebSocket**: 1M messages/month free, then $1.00 per million
- **Lambda**: 1M requests/month free, then $0.20 per million
- **DynamoDB**: 25GB storage + 25 read/write units free
- **Frontend hosting**: 
  - Vercel: Free tier (100GB bandwidth/month)
  - Netlify: Free tier (100GB bandwidth/month)
  - S3: ~$0.023/GB storage + $0.09/GB transfer

**For a class demo with ~10-20 users: Essentially FREE** ✅

---

## Cleanup (After Demo)

To avoid ongoing costs, destroy the infrastructure:

```bash
cd terraform
terraform destroy
```

Type `yes` when prompted. This will delete all AWS resources.

**Note:** This won't delete your frontend deployment. You'll need to remove that separately from your hosting platform.

---

## Quick Reference

### Get WebSocket URL
```bash
cd terraform
terraform output stage_url
```

### Update Lambda code
```bash
# Edit lambda/*.js files, then:
cd terraform
terraform apply
```

### View logs
```bash
# CloudWatch Logs in AWS Console, or:
aws logs tail /aws/lambda/chat-app-sendMessage --follow
```

---

## Next Steps

1. ✅ Deploy backend with Terraform
2. ✅ Get WebSocket URL
3. ✅ Deploy frontend to Vercel/Netlify/S3
4. ✅ Configure environment variable
5. ✅ Test with multiple users
6. ✅ Share URL with classmates!

Good luck with your demo! 🚀


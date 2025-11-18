# Terraform Infrastructure for Real-Time Chat Application

This directory contains Terraform configuration files to manage the AWS infrastructure for the real-time chat application.

## Prerequisites

1. **AWS CLI** installed and configured with credentials
2. **Terraform** installed (>= 1.0)
   ```bash
   brew install terraform  # macOS
   # or download from https://www.terraform.io/downloads
   ```

## Structure

```
terraform/
├── provider.tf      # AWS provider configuration
├── variables.tf     # Variable definitions
├── dynamodb.tf      # DynamoDB tables (Connections, Messages)
├── iam.tf           # IAM role and policies
├── lambda.tf        # Lambda function definitions
├── api-gateway.tf   # API Gateway WebSocket API and routes
└── outputs.tf       # Output values (WebSocket URL, etc.)
```

## Usage

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Review the Plan

```bash
terraform plan
```

This will show you what resources will be created/modified.

### 3. Apply the Configuration

```bash
terraform apply
```

Type `yes` when prompted. This will create:
- DynamoDB tables (Connections, Messages)
- IAM role and policies
- Lambda functions (onConnect, onDisconnect, sendMessage)
- API Gateway WebSocket API with routes
- All necessary permissions

### 4. Get the WebSocket URL

After applying, Terraform will output the WebSocket URL:

```bash
terraform output
```

Look for `stage_url` - this is the URL you'll use in your frontend.

### 5. Update Lambda Code

When you modify Lambda function code in `../lambda/`:

```bash
terraform apply
```

Terraform will detect the code changes and update the Lambda functions automatically.

### 6. Destroy Resources (when done)

```bash
terraform destroy
```

**Warning:** This will delete all resources created by Terraform!

## Variables

You can customize the deployment by creating a `terraform.tfvars` file:

```hcl
aws_region  = "us-east-1"
project_name = "chat-app"
stage_name   = "dev"
```

Then use: `terraform apply -var-file="terraform.tfvars"`

## Important Notes

- **Lambda Code**: Make sure your Lambda function files are in `../lambda/` directory
- **State File**: The `terraform.tfstate` file tracks your infrastructure. Don't delete it unless you want to lose track of your resources.
- **Costs**: All resources use free tier or pay-per-request pricing, so costs should be minimal.

## Troubleshooting

- If you get permission errors, make sure your AWS credentials have sufficient permissions
- If Lambda functions fail, check CloudWatch Logs
- If API Gateway doesn't work, verify the routes are correctly configured


# Terraform Remote State Setup Guide

## Why Remote State?

**DO NOT commit `terraform.tfstate` to GitHub!** Here's why:

1. **Security**: State files contain sensitive information (resource IDs, sometimes credentials)
2. **Conflicts**: Multiple developers/devices will create merge conflicts
3. **Best Practice**: Use remote state storage (S3) for team collaboration

## Solution: S3 Backend with DynamoDB Locking

This setup allows multiple devices to share the same Terraform state safely.

## Setup Instructions

### Step 1: Create S3 Bucket and DynamoDB Table

Run the bootstrap script to create the necessary resources:

```bash
cd terraform
./bootstrap-backend.sh [bucket-name] [region]
```

**Example:**
```bash
./bootstrap-backend.sh terraform-state-chat-app us-east-1
```

If you don't provide a bucket name, it will generate a unique one.

**What this creates:**
- S3 bucket for storing Terraform state (with versioning and encryption)
- DynamoDB table for state locking (prevents concurrent modifications)

### Step 2: Create backend.tf

Copy the example file and fill in your values:

```bash
cp backend.tf.example backend.tf
```

Edit `backend.tf` with the bucket name from Step 1:

```hcl
terraform {
  backend "s3" {
    bucket         = "terraform-state-chat-app-xxxx"  # From bootstrap script
    key            = "chat-app/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

**Important:** `backend.tf` is in `.gitignore` - don't commit it!

### Step 3: Migrate Existing State

If you already have resources deployed (like on your other device):

```bash
# Initialize with backend
terraform init -migrate-state

# When prompted, type "yes" to migrate existing state to S3
```

This will:
- Copy your local `terraform.tfstate` to S3
- Update your local config to use remote state
- Keep a backup of your local state

### Step 4: Verify Setup

```bash
# This should show no changes (state is now in S3)
terraform plan

# Verify state is in S3
aws s3 ls s3://your-bucket-name/chat-app/
```

## Using Remote State on Multiple Devices

### On Your Other Device:

1. **Clone the repo** (if not already)
2. **Create `backend.tf`** with the same values:
   ```bash
   cp backend.tf.example backend.tf
   # Edit backend.tf with the same bucket name
   ```
3. **Initialize Terraform:**
   ```bash
   terraform init
   ```
   This will download the state from S3 automatically.

4. **Now both devices share the same state!**

## Troubleshooting

### "Error: Failed to get existing workspaces"

Make sure:
- The S3 bucket exists
- Your AWS credentials have permissions to access the bucket
- The bucket name in `backend.tf` matches the one created

### "Error acquiring the state lock"

Someone else (or another process) is using Terraform. Wait for them to finish, or if stuck:
```bash
# Check who has the lock
aws dynamodb scan --table-name terraform-state-lock

# If needed, manually delete the lock (be careful!)
aws dynamodb delete-item \
  --table-name terraform-state-lock \
  --key '{"LockID": {"S": "your-lock-id"}}'
```

### "State file not found"

If migrating from local state:
- Make sure you ran `terraform init -migrate-state`
- Check that your local `terraform.tfstate` exists before migration
- Verify the S3 bucket has the state file: `aws s3 ls s3://bucket-name/chat-app/`

## Manual Setup (Alternative)

If you prefer to create resources manually:

### Create S3 Bucket:
```bash
aws s3api create-bucket --bucket terraform-state-chat-app-xxxx --region us-east-1
aws s3api put-bucket-versioning --bucket terraform-state-chat-app-xxxx --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket terraform-state-chat-app-xxxx --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

### Create DynamoDB Table:
```bash
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Cost

- **S3**: ~$0.023 per GB/month (state files are tiny, <1MB typically)
- **DynamoDB**: Pay-per-request, essentially free for state locking
- **Total**: Effectively free for small projects

## Security Best Practices

1. ✅ **DO**: Use S3 bucket encryption (bootstrap script does this)
2. ✅ **DO**: Use versioning (bootstrap script enables this)
3. ✅ **DO**: Block public access (bootstrap script does this)
4. ✅ **DO**: Use IAM policies to restrict access to the bucket
5. ❌ **DON'T**: Commit `backend.tf` or `terraform.tfstate` to Git
6. ❌ **DON'T**: Share AWS credentials

## Next Steps

After setup:
1. Both devices can now run `terraform plan` and `terraform apply`
2. State is automatically synced via S3
3. DynamoDB prevents conflicts with locking
4. You can safely delete local `terraform.tfstate` files (they're backed up in S3 with versioning)


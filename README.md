# Real-Time Chat Application - AWS Serverless

A real-time chat application built with AWS serverless services: API Gateway WebSocket API, Lambda functions, and DynamoDB.

## 🏗️ Architecture

See [plan.md](./plan.md) for the complete architecture overview.

## Project Structure

```
AWS_CHAT/
├── terraform/          # Infrastructure as Code (Terraform)
│   ├── provider.tf
│   ├── variables.tf
│   ├── dynamodb.tf
│   ├── iam.tf
│   ├── lambda.tf
│   ├── api-gateway.tf
│   └── outputs.tf
├── lambda/             # Lambda function source code
│   ├── onConnect.js
│   ├── onDisconnect.js
│   └── sendMessage.js
├── frontend/           # Frontend application (to be added)
│   └── index.html
├── plan.md            # Architecture documentation
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured (`aws configure`)
- Terraform >= 1.0 installed ([Download](https://www.terraform.io/downloads))
- Node.js (for Lambda functions)

### Option 1: Using Terraform (Recommended)

1. Clone this repository:
   ```bash
   git clone <your-repo-url>
   cd AWS_CHAT
   ```

2. Navigate to terraform directory:
   ```bash
   cd terraform
   ```

3. Initialize Terraform:
   ```bash
   terraform init
   ```

4. Review the deployment plan:
   ```bash
   terraform plan
   ```

5. Deploy infrastructure:
   ```bash
   terraform apply
   ```
   Type `yes` when prompted.

6. Get WebSocket URL:
   ```bash
   terraform output stage_url
   ```

7. Update your frontend with the WebSocket URL

### Option 2: Manual AWS Console Setup

Follow the step-by-step guide in the implementation plan.

## Lambda Functions

- **onConnect**: Handles new WebSocket connections, stores connection ID in DynamoDB
- **onDisconnect**: Handles disconnections, removes connection ID from DynamoDB
- **sendMessage**: Processes messages, saves to DynamoDB, broadcasts to all connected users

## DynamoDB Tables

- **Connections**: Tracks active WebSocket connections
  - Partition Key: `connectionId` (String)
- **Messages**: Stores chat message history
  - Partition Key: `messageId` (String)
  - Sort Key: `timestamp` (String)

## Development Workflow

1. Edit Lambda code in `lambda/` directory
2. Run `terraform apply` to deploy changes
3. Test via frontend or AWS Console

## 💰 Cost

All services use AWS Free Tier or pay-per-request pricing. Estimated cost: **$0 for demo/testing**.

| Service | Free Tier |
|---------|-----------|
| API Gateway | 1M messages/month free |
| Lambda | 1M requests + 400K GB-seconds/month free |
| DynamoDB | 25GB storage + 25 read/write units free |

## 📝 License

This is a class project. See [LICENSE](./LICENSE) file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📚 Resources

- [AWS API Gateway WebSocket API](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)


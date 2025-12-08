# Real-Time Chat Application - AWS Serverless

A real-time chat application built with AWS serverless services: API Gateway WebSocket API, Lambda functions, and DynamoDB. Features a React frontend with TypeScript and a complete backend infrastructure managed with Terraform.

## Architecture

The application uses:
- **API Gateway WebSocket API** for real-time bidirectional communication
- **Lambda Functions** for connection management, message processing, and authorization
- **DynamoDB** for storing connections and message history
- **React + TypeScript Frontend** with Vite for the user interface

## Project Structure

```
aws-serverlesss-chat/
├── terraform/              # Infrastructure as Code (Terraform)
│   ├── provider.tf
│   ├── variables.tf
│   ├── backend.tf
│   ├── dynamodb.tf
│   ├── iam.tf
│   ├── lambda.tf
│   ├── api-gateway.tf
│   ├── outputs.tf
│   └── lambda_packages/    # Generated Lambda deployment packages
├── lambda/                 # Lambda function source code
│   ├── authorizer.js       # WebSocket connection authorization
│   ├── onConnect.js        # Handles new WebSocket connections
│   ├── onDisconnect.js     # Handles disconnections
│   ├── sendMessage.js      # Processes and broadcasts messages
│   └── package.json
├── frontend/               # React + TypeScript frontend application
│   ├── src/
│   │   ├── App.tsx         # Main application component
│   │   ├── pages/          # Page components
│   │   │   ├── LandingPage.tsx
│   │   │   ├── ChatPage.tsx
│   │   │   └── LearnMorePage.tsx
│   │   ├── components/     # Reusable components
│   │   ├── hooks/          # Custom React hooks
│   │   │   └── useWebSocket.ts
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── vite.config.ts
├── tests/                  # Lambda function tests
│   ├── events/             # Test event payloads
│   └── test-lambdas.sh     # Test script
├── DEPLOYMENT_GUIDE.md     # Detailed deployment instructions
└── README.md               # This file
```

## Quick Start

### Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured (`aws configure`)
- Terraform >= 1.0 installed ([Download](https://www.terraform.io/downloads))
- Node.js >= 18 (for Lambda functions and frontend)

### Backend Deployment

1. Clone this repository:
   ```bash
   git clone <your-repo-url>
   cd aws-serverlesss-chat
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
   Save this URL for frontend configuration.

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   echo "VITE_WEBSOCKET_URL=wss://your-api-id.execute-api.us-east-1.amazonaws.com/dev" > .env.local
   ```
   Replace the URL with the output from `terraform output stage_url`.

4. Run development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

For detailed deployment instructions including hosting options, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## Lambda Functions

- **authorizer**: Validates username format and connection parameters before allowing WebSocket connections. Enforces username validation rules (2-20 characters, alphanumeric with spaces, hyphens, underscores).

- **onConnect**: Handles new WebSocket connections. Stores connection ID and username in DynamoDB when a user connects.

- **onDisconnect**: Handles WebSocket disconnections. Removes connection ID from DynamoDB when a user disconnects.

- **sendMessage**: Processes incoming messages and handles two route actions:
  - `sendMessage`: Saves message to DynamoDB and broadcasts to all connected users
  - `getHistory`: Retrieves and sends recent message history to the requesting client

## API Gateway Routes

- **$connect**: WebSocket connection route with custom authorizer
- **$disconnect**: WebSocket disconnection route
- **sendMessage**: Custom route for sending chat messages
- **getHistory**: Custom route for retrieving message history

## DynamoDB Tables

- **Connections**: Tracks active WebSocket connections
  - Partition Key: `connectionId` (String)
  - Billing Mode: Pay-per-request
  - Encryption: Enabled (AWS managed keys)

- **Messages**: Stores chat message history
  - Partition Key: `messageId` (String)
  - Sort Key: `timestamp` (String)
  - Billing Mode: Pay-per-request
  - Encryption: Enabled (AWS managed keys)

## Frontend Features

- **Landing Page**: Welcome page with project information
- **Chat Page**: Real-time chat interface with:
  - Username management (stored in localStorage)
  - Dark/light theme toggle
  - Connection status indicator
  - Message history display
  - Real-time message broadcasting
- **Learn More Page**: Detailed information about the application architecture and features

## Development Workflow

1. Edit Lambda code in `lambda/` directory
2. Run `terraform apply` from the `terraform/` directory to deploy changes
3. Edit frontend code in `frontend/src/` directory
4. Test locally with `npm run dev` in the `frontend/` directory
5. Build frontend with `npm run build` for production deployment

## Testing

Lambda functions can be tested using the test scripts in the `tests/` directory. See [tests/README.md](./tests/README.md) for testing instructions.

## Cost

All services use AWS Free Tier or pay-per-request pricing. Estimated cost: $0 for demo/testing.

| Service | Free Tier |
|---------|-----------|
| API Gateway | 1M messages/month free |
| Lambda | 1M requests + 400K GB-seconds/month free |
| DynamoDB | 25GB storage + 25 read/write units free |

## License

This is a class project. See [LICENSE](./LICENSE) file for details.

## Resources

- [AWS API Gateway WebSocket API](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

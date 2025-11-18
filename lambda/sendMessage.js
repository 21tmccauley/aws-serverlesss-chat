import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body);
  const message = body.message;
  const username = body.username || 'Anonymous';
  
  // Get the API Gateway endpoint URL
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const apiGatewayEndpoint = `https://${domainName}/${stage}`;
  
  const apiGatewayClient = new ApiGatewayManagementApiClient({
    endpoint: apiGatewayEndpoint
  });
  
  // Save message to DynamoDB
  const messageId = Date.now().toString();
  await dynamodb.send(new PutCommand({
    TableName: 'Messages',
    Item: {
      messageId: messageId,
      timestamp: new Date().toISOString(),
      username: username,
      message: message
    }
  }));
  
  // Get all active connections
  const connectionsResult = await dynamodb.send(new ScanCommand({
    TableName: 'Connections'
  }));
  
  // Broadcast message to all connections
  const broadcastPromises = connectionsResult.Items.map(async (connection) => {
    try {
      await apiGatewayClient.send(new PostToConnectionCommand({
        ConnectionId: connection.connectionId,
        Data: JSON.stringify({
          username: username,
          message: message,
          timestamp: new Date().toISOString()
        })
      }));
    } catch (err) {
      // If connection no longer exists (410 error), remove it from table
      if (err.statusCode === 410) {
        await dynamodb.send(new DeleteCommand({
          TableName: 'Connections',
          Key: { connectionId: connection.connectionId }
        }));
      }
    }
  });
  
  await Promise.all(broadcastPromises);
  
  return { statusCode: 200, body: 'Message sent' };
};


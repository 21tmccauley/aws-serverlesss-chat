const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");

const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body);
  const message = body.message;
  const username = body.username || 'Anonymous';
  const connectionsTable = process.env.CONNECTIONS_TABLE;
  const messagesTable = process.env.MESSAGES_TABLE;
  
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
    TableName: messagesTable,
    Item: {
      messageId: messageId,
      timestamp: new Date().toISOString(),
      username: username,
      message: message
    }
  }));
  
  // Get all active connections
  const connectionsResult = await dynamodb.send(new ScanCommand({
    TableName: connectionsTable
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
          TableName: connectionsTable,
          Key: { connectionId: connection.connectionId }
        }));
      }
    }
  });
  
  await Promise.all(broadcastPromises);
  
  return { statusCode: 200, body: 'Message sent' };
};


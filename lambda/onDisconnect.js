const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

// Reuse clients across invocations (Lambda container reuse)
const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  try {
    const connectionId = event.requestContext?.connectionId;
    const tableName = process.env.CONNECTIONS_TABLE;

    // Validate required data
    if (!connectionId) {
      console.error('Missing connectionId in request context');
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing connectionId' }) };
    }

    if (!tableName) {
      console.error('CONNECTIONS_TABLE environment variable not set');
      return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
    }

    // Remove connection
    await dynamodb.send(new DeleteCommand({
      TableName: tableName,
      Key: {
        connectionId: connectionId
      }
    }));

    console.log(`Connection removed: ${connectionId}`);
    return { statusCode: 200, body: JSON.stringify({ message: 'Disconnected' }) };
  } catch (error) {
    console.error('Error in onDisconnect:', error);
    // Don't fail if connection already removed
    return { statusCode: 200, body: JSON.stringify({ message: 'Disconnected' }) };
  }
};

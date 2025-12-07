const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

// Reuse clients across invocations (Lambda container reuse)
const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  try {
    const connectionId = event.requestContext?.connectionId;
    const username = event.queryStringParameters?.username || 'Anonymous';
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

    // Store connection
    await dynamodb.send(new PutCommand({
      TableName: tableName,
      Item: {
        connectionId: connectionId,
        username: username,
        connectedAt: new Date().toISOString()
      }
    }));

    console.log(`Connection established: ${connectionId} as ${username}`);
    return { statusCode: 200, body: JSON.stringify({ message: 'Connected' }) };
  } catch (error) {
    console.error('Error in onConnect:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Failed to establish connection' }) 
    };
  }
};

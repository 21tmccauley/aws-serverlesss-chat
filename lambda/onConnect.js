const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const username = event.queryStringParameters?.username || 'Anonymous';
  const tableName = process.env.CONNECTIONS_TABLE;
  
  await dynamodb.send(new PutCommand({
    TableName: tableName,
    Item: {
      connectionId: connectionId,
      username: username,
      connectedAt: new Date().toISOString()
    }
  }));
  
  return { statusCode: 200, body: 'Connected' };
};


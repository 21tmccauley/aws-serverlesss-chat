import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const username = event.queryStringParameters?.username || 'Anonymous';
  
  await dynamodb.send(new PutCommand({
    TableName: 'Connections',
    Item: {
      connectionId: connectionId,
      username: username,
      connectedAt: new Date().toISOString()
    }
  }));
  
  return { statusCode: 200, body: 'Connected' };
};


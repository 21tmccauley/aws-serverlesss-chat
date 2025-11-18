import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  
  await dynamodb.send(new DeleteCommand({
    TableName: 'Connections',
    Key: {
      connectionId: connectionId
    }
  }));
  
  return { statusCode: 200, body: 'Disconnected' };
};


const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const tableName = process.env.CONNECTIONS_TABLE;
  
  await dynamodb.send(new DeleteCommand({
    TableName: tableName,
    Key: {
      connectionId: connectionId
    }
  }));
  
  return { statusCode: 200, body: 'Disconnected' };
};


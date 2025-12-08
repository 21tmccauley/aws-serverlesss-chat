const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");

// Reuse clients across invocations (Lambda container reuse)
const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

// Helper to get API Gateway client (endpoint may vary per request)
const getApiGatewayClient = (event) => {
  const domainName = event.requestContext?.domainName;
  const stage = event.requestContext?.stage;
  
  if (!domainName || !stage) {
    throw new Error('Missing domainName or stage in request context');
  }
  
  return new ApiGatewayManagementApiClient({
    endpoint: `https://${domainName}/${stage}`
  });
};

// Fetch recent messages from DynamoDB (simple scan approach for demo)
const fetchRecentMessages = async (messagesTable, limit = 50) => {
  try {
    const result = await dynamodb.send(new ScanCommand({
      TableName: messagesTable,
      Limit: limit * 2 // Get more than needed to account for filtering
    }));

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    // Sort by timestamp descending and limit results
    const sortedMessages = result.Items
      .sort((a, b) => {
        // Sort by timestamp descending (most recent first)
        return new Date(b.timestamp) - new Date(a.timestamp);
      })
      .slice(0, limit)
      .reverse(); // Reverse to send oldest first (chronological order)

    return sortedMessages;
  } catch (error) {
    console.error('Error fetching recent messages:', error);
    return []; // Return empty array on error
  }
};

// Helper to broadcast message to all connections
const broadcastMessage = async (apiGatewayClient, connectionsTable, messageData) => {
  try {
    // Get all active connections
    const result = await dynamodb.send(new ScanCommand({
      TableName: connectionsTable
    }));

    if (!result.Items || result.Items.length === 0) {
      console.log('No active connections to broadcast to');
      return;
    }

    // Broadcast to all connections
    const broadcastPromises = result.Items.map(async (connection) => {
      try {
        await apiGatewayClient.send(new PostToConnectionCommand({
          ConnectionId: connection.connectionId,
          Data: JSON.stringify(messageData)
        }));
      } catch (error) {
        // Remove stale connections (410 = Gone)
        if (error.statusCode === 410 || error.name === 'GoneException') {
          console.log(`Removing stale connection: ${connection.connectionId}`);
          try {
            await dynamodb.send(new DeleteCommand({
              TableName: connectionsTable,
              Key: { connectionId: connection.connectionId }
            }));
          } catch (deleteError) {
            console.error(`Failed to delete stale connection ${connection.connectionId}:`, deleteError);
          }
        } else {
          console.error(`Error broadcasting to ${connection.connectionId}:`, error);
        }
      }
    });

    await Promise.all(broadcastPromises);
    console.log(`Broadcasted message to ${result.Items.length} connection(s)`);
  } catch (error) {
    console.error('Error in broadcastMessage:', error);
    throw error;
  }
};

exports.handler = async (event) => {
  try {
    const connectionId = event.requestContext?.connectionId;
    const connectionsTable = process.env.CONNECTIONS_TABLE;
    const messagesTable = process.env.MESSAGES_TABLE;

    // Validate required data
    if (!connectionId) {
      console.error('Missing connectionId in request context');
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing connectionId' }) };
    }

    if (!connectionsTable || !messagesTable) {
      console.error('Environment variables not set');
      return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
    }

    // Parse message body
    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid message format' }) };
    }

    // Handle getHistory action
    if (body.action === 'getHistory') {
      try {
        console.log(`Fetching message history for connection: ${connectionId}`);
        const recentMessages = await fetchRecentMessages(messagesTable, 50);
        
        const apiGatewayClient = getApiGatewayClient(event);
        
        // Send each message to the requesting connection
        for (const msg of recentMessages) {
          try {
            await apiGatewayClient.send(new PostToConnectionCommand({
              ConnectionId: connectionId,
              Data: JSON.stringify({
                username: msg.username,
                message: msg.message,
                timestamp: msg.timestamp
              })
            }));
          } catch (sendError) {
            console.warn(`Failed to send historical message to ${connectionId}:`, sendError.message || sendError);
            // Continue sending other messages even if one fails
          }
        }
        
        console.log(`Sent ${recentMessages.length} recent messages to ${connectionId}`);
        return { statusCode: 200, body: JSON.stringify({ message: 'History sent' }) };
      } catch (error) {
        console.error('Error sending message history:', error);
        return { 
          statusCode: 500, 
          body: JSON.stringify({ error: 'Failed to fetch message history' }) 
        };
      }
    }

    // Handle regular sendMessage action
    const message = body.message?.trim();

    // Validate message
    if (!message || message.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Message cannot be empty' }) };
    }

    if (message.length > 1000) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Message too long (max 1000 characters)' }) };
    }

    // Get username from connections table (authoritative source - don't trust client)
    let username = 'Anonymous';
    try {
      const connectionResult = await dynamodb.send(new GetCommand({
        TableName: connectionsTable,
        Key: { connectionId: connectionId }
      }));
      
      if (connectionResult.Item && connectionResult.Item.username) {
        username = connectionResult.Item.username;
      } else {
        console.warn(`Connection ${connectionId} not found in connections table, using Anonymous`);
      }
    } catch (error) {
      console.error(`Error fetching connection ${connectionId}:`, error);
      // Continue with Anonymous if we can't fetch the connection
    }

    // Prepare message data
    const timestamp = new Date().toISOString();
    const messageData = {
      username: username,
      message: message,
      timestamp: timestamp
    };

    // Save message to DynamoDB
    const messageId = `${Date.now()}-${connectionId}`;
    await dynamodb.send(new PutCommand({
      TableName: messagesTable,
      Item: {
        messageId: messageId,
        timestamp: timestamp,
        username: username,
        message: message
      }
    }));

    console.log(`Message saved: ${messageId} from ${username}`);

    // Broadcast to all connections
    const apiGatewayClient = getApiGatewayClient(event);
    await broadcastMessage(apiGatewayClient, connectionsTable, messageData);

    return { statusCode: 200, body: JSON.stringify({ message: 'Message sent' }) };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Failed to send message' }) 
    };
  }
};

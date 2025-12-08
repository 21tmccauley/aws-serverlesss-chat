const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

// Reuse clients across invocations (Lambda container reuse)
const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

/**
 * Validate username format (server-side validation matching frontend)
 */
function validateUsername(username) {
  const trimmed = username.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Username cannot be empty' };
  }
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Username must be at least 2 characters' };
  }
  
  if (trimmed.length > 20) {
    return { valid: false, error: 'Username must be 20 characters or less' };
  }
  
  // Allow alphanumeric, spaces, hyphens, underscores
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, spaces, hyphens, and underscores' };
  }
  
  return { valid: true, username: trimmed };
}

exports.handler = async (event) => {
  try {
    const connectionId = event.requestContext?.connectionId;
    
    // Get username from authorizer context (if authorizer is used) or query string
    // Authorizer context takes precedence for security
    const username = event.requestContext?.authorizer?.username 
      || event.queryStringParameters?.username 
      || 'Anonymous';
    
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

    // Server-side username validation (defense in depth)
    const validation = validateUsername(username);
    if (!validation.valid) {
      console.error(`Invalid username: ${username} - ${validation.error}`);
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: validation.error || 'Invalid username' }) 
      };
    }
    
    const validatedUsername = validation.username;

    // Store connection with validated username
    await dynamodb.send(new PutCommand({
      TableName: tableName,
      Item: {
        connectionId: connectionId,
        username: validatedUsername,
        connectedAt: new Date().toISOString()
      }
    }));

    console.log(`Connection established: ${connectionId} as ${validatedUsername}`);
    return { statusCode: 200, body: JSON.stringify({ message: 'Connected' }) };
  } catch (error) {
    console.error('Error in onConnect:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Failed to establish connection' }) 
    };
  }
};

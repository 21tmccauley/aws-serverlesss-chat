/**
 * Lambda Authorizer for WebSocket API Gateway
 * Validates username format and connection parameters before allowing WebSocket connection
 */
exports.handler = async (event) => {
  try {
    // Extract username from query string parameters
    // For WebSocket API, query string params are in event.queryStringParameters
    const username = event.queryStringParameters?.username || event.queryStringParameters?.Username;
    
    // If no username provided, allow Anonymous (but validate it)
    const finalUsername = username || 'Anonymous';
    
    // Validate username format (must match frontend validation)
    const trimmed = finalUsername.trim();
    
    // Get route ARN (WebSocket APIs use routeArn, REST APIs use methodArn)
    const resourceArn = event.routeArn || event.methodArn || event.resource || '*';
    
    // Validation rules (matching frontend/src/utils/username.ts)
    if (!trimmed) {
      return generatePolicy('user', 'Deny', resourceArn, {
        error: 'Username cannot be empty'
      });
    }
    
    if (trimmed.length < 2) {
      return generatePolicy('user', 'Deny', resourceArn, {
        error: 'Username must be at least 2 characters'
      });
    }
    
    if (trimmed.length > 20) {
      return generatePolicy('user', 'Deny', resourceArn, {
        error: 'Username must be 20 characters or less'
      });
    }
    
    // Allow alphanumeric, spaces, hyphens, underscores
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
      return generatePolicy('user', 'Deny', resourceArn, {
        error: 'Username can only contain letters, numbers, spaces, hyphens, and underscores'
      });
    }
    
    // Additional security: Check for potential injection patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\(/i,
      /expression\(/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(trimmed))) {
      return generatePolicy('user', 'Deny', resourceArn, {
        error: 'Invalid username format'
      });
    }
    
    // Username is valid - allow connection
    // Pass username in context for use in onConnect Lambda
    return generatePolicy('user', 'Allow', resourceArn, {
      username: trimmed,
      validated: true
    });
    
  } catch (error) {
    console.error('Error in authorizer:', error);
    // Deny on error for security
    const resourceArn = event.routeArn || event.methodArn || event.resource || '*';
    return generatePolicy('user', 'Deny', resourceArn, {
      error: 'Authorization failed'
    });
  }
};

/**
 * Generate IAM policy for API Gateway authorizer
 */
function generatePolicy(principalId, effect, resource, context = {}) {
  const authResponse = {
    principalId: principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    }
  };
  
  // Add context (passed to Lambda function)
  if (Object.keys(context).length > 0) {
    authResponse.context = {};
    for (const [key, value] of Object.entries(context)) {
      authResponse.context[key] = String(value);
    }
  }
  
  return authResponse;
}


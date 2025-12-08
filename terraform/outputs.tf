output "websocket_api_url" {
  description = "WebSocket API URL"
  value       = aws_apigatewayv2_api.websocket_api.api_endpoint
}

output "websocket_connection_url" {
  description = "Full WebSocket connection URL"
  value       = replace(aws_apigatewayv2_api.websocket_api.api_endpoint, "https://", "wss://")
}

output "stage_url" {
  description = "WebSocket URL with stage"
  value       = "${replace(aws_apigatewayv2_api.websocket_api.api_endpoint, "https://", "wss://")}/${aws_apigatewayv2_stage.websocket_stage.name}"
}

output "connections_table_name" {
  description = "DynamoDB Connections table name"
  value       = aws_dynamodb_table.connections.name
}

output "messages_table_name" {
  description = "DynamoDB Messages table name"
  value       = aws_dynamodb_table.messages.name
}

output "authorizer_function_name" {
  description = "Lambda Authorizer function name"
  value       = aws_lambda_function.authorizer.function_name
}


# WebSocket API Gateway
resource "aws_apigatewayv2_api" "websocket_api" {
  name                       = "${var.project_name}-websocket"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"

  tags = {
    Name        = "${var.project_name}-websocket-api"
    Environment = var.stage_name
  }
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "websocket_stage" {
  api_id      = aws_apigatewayv2_api.websocket_api.id
  name        = var.stage_name
  auto_deploy = true

  tags = {
    Name        = "${var.project_name}-websocket-stage"
    Environment = var.stage_name
  }
}

# Lambda Integration for onConnect
resource "aws_apigatewayv2_integration" "on_connect_integration" {
  api_id           = aws_apigatewayv2_api.websocket_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.on_connect.invoke_arn
}

# Lambda Integration for onDisconnect
resource "aws_apigatewayv2_integration" "on_disconnect_integration" {
  api_id           = aws_apigatewayv2_api.websocket_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.on_disconnect.invoke_arn
}

# Lambda Integration for sendMessage
resource "aws_apigatewayv2_integration" "send_message_integration" {
  api_id           = aws_apigatewayv2_api.websocket_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.send_message.invoke_arn
}

# $connect Route
resource "aws_apigatewayv2_route" "connect_route" {
  api_id    = aws_apigatewayv2_api.websocket_api.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.on_connect_integration.id}"
}

# $disconnect Route
resource "aws_apigatewayv2_route" "disconnect_route" {
  api_id    = aws_apigatewayv2_api.websocket_api.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.on_disconnect_integration.id}"
}

# sendMessage Route
resource "aws_apigatewayv2_route" "send_message_route" {
  api_id    = aws_apigatewayv2_api.websocket_api.id
  route_key = "sendMessage"
  target    = "integrations/${aws_apigatewayv2_integration.send_message_integration.id}"
}

# Permission for API Gateway to invoke onConnect
resource "aws_lambda_permission" "on_connect_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.on_connect.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket_api.execution_arn}/*/*"
}

# Permission for API Gateway to invoke onDisconnect
resource "aws_lambda_permission" "on_disconnect_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.on_disconnect.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket_api.execution_arn}/*/*"
}

# Permission for API Gateway to invoke sendMessage
resource "aws_lambda_permission" "send_message_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.send_message.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket_api.execution_arn}/*/*"
}


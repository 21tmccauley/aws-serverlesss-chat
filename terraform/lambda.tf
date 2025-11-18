# Archive Lambda function code
data "archive_file" "on_connect_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambda/onConnect.js"
  output_path = "${path.module}/.terraform/onConnect.zip"
}

data "archive_file" "on_disconnect_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambda/onDisconnect.js"
  output_path = "${path.module}/.terraform/onDisconnect.zip"
}

data "archive_file" "send_message_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambda/sendMessage.js"
  output_path = "${path.module}/.terraform/sendMessage.zip"
}

# onConnect Lambda Function
resource "aws_lambda_function" "on_connect" {
  filename         = data.archive_file.on_connect_zip.output_path
  function_name    = "onConnect"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "onConnect.handler"
  source_code_hash = data.archive_file.on_connect_zip.output_base64sha256
  runtime          = "nodejs20.x"

  environment {
    variables = {
      CONNECTIONS_TABLE = aws_dynamodb_table.connections.name
    }
  }

  tags = {
    Name        = "${var.project_name}-onConnect"
    Environment = var.stage_name
  }
}

# onDisconnect Lambda Function
resource "aws_lambda_function" "on_disconnect" {
  filename         = data.archive_file.on_disconnect_zip.output_path
  function_name    = "onDisconnect"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "onDisconnect.handler"
  source_code_hash = data.archive_file.on_disconnect_zip.output_base64sha256
  runtime          = "nodejs20.x"

  environment {
    variables = {
      CONNECTIONS_TABLE = aws_dynamodb_table.connections.name
    }
  }

  tags = {
    Name        = "${var.project_name}-onDisconnect"
    Environment = var.stage_name
  }
}

# sendMessage Lambda Function
resource "aws_lambda_function" "send_message" {
  filename         = data.archive_file.send_message_zip.output_path
  function_name    = "sendMessage"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "sendMessage.handler"
  source_code_hash = data.archive_file.send_message_zip.output_base64sha256
  runtime          = "nodejs20.x"

  environment {
    variables = {
      CONNECTIONS_TABLE = aws_dynamodb_table.connections.name
      MESSAGES_TABLE    = aws_dynamodb_table.messages.name
    }
  }

  tags = {
    Name        = "${var.project_name}-sendMessage"
    Environment = var.stage_name
  }
}


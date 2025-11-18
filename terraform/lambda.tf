# Install Lambda dependencies
resource "null_resource" "lambda_dependencies" {
  triggers = {
    package_json = filemd5("${path.module}/../lambda/package.json")
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/../lambda && npm install --production"
  }
}

# Archive Lambda function code with dependencies
data "archive_file" "on_connect_zip" {
  depends_on  = [null_resource.lambda_dependencies]
  type        = "zip"
  source_dir  = "${path.module}/../lambda"
  output_path = "${path.module}/lambda_packages/onConnect.zip"
  excludes    = ["onDisconnect.js", "sendMessage.js", "package.json", "package-lock.json"]
}

data "archive_file" "on_disconnect_zip" {
  depends_on  = [null_resource.lambda_dependencies]
  type        = "zip"
  source_dir  = "${path.module}/../lambda"
  output_path = "${path.module}/lambda_packages/onDisconnect.zip"
  excludes    = ["onConnect.js", "sendMessage.js", "package.json", "package-lock.json"]
}

data "archive_file" "send_message_zip" {
  depends_on  = [null_resource.lambda_dependencies]
  type        = "zip"
  source_dir  = "${path.module}/../lambda"
  output_path = "${path.module}/lambda_packages/sendMessage.zip"
  excludes    = ["onConnect.js", "onDisconnect.js", "package.json", "package-lock.json"]
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


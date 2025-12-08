# Connections Table - Tracks active WebSocket connections
resource "aws_dynamodb_table" "connections" {
  name         = "Connections"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "connectionId"

  attribute {
    name = "connectionId"
    type = "S"
  }

  # Enable encryption at rest using AWS managed keys
  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "${var.project_name}-connections"
    Environment = var.stage_name
  }
}

# Messages Table - Stores chat message history
resource "aws_dynamodb_table" "messages" {
  name         = "Messages"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "messageId"
  range_key    = "timestamp"

  attribute {
    name = "messageId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  # Enable encryption at rest using AWS managed keys
  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "${var.project_name}-messages"
    Environment = var.stage_name
  }
}


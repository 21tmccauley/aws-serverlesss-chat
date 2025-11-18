#!/bin/bash

# Bash Test Script for Lambda Functions
# Usage: ./tests/test-lambdas.sh [function-name]

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FUNCTION_NAME="${1:-}"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$SCRIPT_DIR"
EVENTS_DIR="$TESTS_DIR/events"
RESPONSES_DIR="$TESTS_DIR/responses"

# Create responses directory if it doesn't exist
mkdir -p "$RESPONSES_DIR"

# Test counter
PASSED=0
FAILED=0

test_lambda_function() {
    local function_name=$1
    local event_file=$2
    local description=$3
    
    echo -e "${BLUE}Testing $function_name - $description${NC}"
    echo ""
    
    local event_path="$EVENTS_DIR/$event_file"
    local response_path="$RESPONSES_DIR/${function_name}-response.json"
    
    if [ ! -f "$event_path" ]; then
        echo -e "${RED}✗ Event file not found: $event_path${NC}"
        ((FAILED++))
        return 1
    fi
    
    # Invoke Lambda function
    if aws lambda invoke \
        --function-name "$function_name" \
        --payload "file://$event_path" \
        --cli-binary-format raw-in-base64-out \
        "$response_path" > /dev/null 2>&1; then
        
        echo -e "${GREEN}✓ $function_name test passed${NC}"
        
        # Display response
        if [ -f "$response_path" ]; then
            echo "Response:"
            cat "$response_path" | jq '.' 2>/dev/null || cat "$response_path"
        fi
        
        echo ""
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ $function_name test failed${NC}"
        echo ""
        ((FAILED++))
        return 1
    fi
}

show_logs() {
    local function_name=$1
    echo -e "${BLUE}Fetching recent logs for $function_name...${NC}"
    aws logs tail "/aws/lambda/$function_name" --since 10m --format short
    echo ""
}

# Main execution
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Lambda Function Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed or not in PATH${NC}"
    exit 1
fi

# Define functions to test
FUNCTIONS=("onConnect" "onDisconnect" "sendMessage")

# Filter by function name if provided
if [ -n "$FUNCTION_NAME" ]; then
    if [[ " ${FUNCTIONS[@]} " =~ " ${FUNCTION_NAME} " ]]; then
        FUNCTIONS=("$FUNCTION_NAME")
    else
        echo -e "${RED}Error: Function '$FUNCTION_NAME' not found${NC}"
        echo -e "${YELLOW}Available functions: ${FUNCTIONS[*]}${NC}"
        exit 1
    fi
fi

# Run tests
for func in "${FUNCTIONS[@]}"; do
    case $func in
        "onConnect")
            test_lambda_function "onConnect" "onConnect-event.json" "with username"
            test_lambda_function "onConnect" "onConnect-event-no-username.json" "without username (anonymous)"
            ;;
        "onDisconnect")
            test_lambda_function "onDisconnect" "onDisconnect-event.json" "disconnect event"
            ;;
        "sendMessage")
            test_lambda_function "sendMessage" "sendMessage-event.json" "with username"
            test_lambda_function "sendMessage" "sendMessage-event-anonymous.json" "anonymous user"
            ;;
    esac
done

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""
echo "Test responses saved to: $RESPONSES_DIR"
echo ""
echo "To view logs for a function, run:"
echo "  aws logs tail /aws/lambda/<function-name> --follow"
echo ""

# Exit with error if any tests failed
if [ $FAILED -gt 0 ]; then
    exit 1
fi


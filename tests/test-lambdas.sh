#!/bin/bash

# Bash Test Script for Lambda Functions
# Usage: ./tests/test-lambdas.sh [function-name]

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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
TOTAL=0

# Function to validate response
validate_response() {
    local response_path=$1
    local expected_status=$2
    local expected_key=$3
    local expected_value=$4
    
    if [ ! -f "$response_path" ]; then
        return 1
    fi
    
    # Check if jq is available for JSON parsing
    if ! command -v jq &> /dev/null; then
        return 0  # Skip validation if jq not available
    fi
    
    local status_code=$(jq -r '.statusCode // empty' "$response_path" 2>/dev/null)
    local body=$(jq -r '.body // empty' "$response_path" 2>/dev/null)
    
    # Validate status code if expected
    if [ -n "$expected_status" ]; then
        if [ "$status_code" != "$expected_status" ]; then
            return 1
        fi
    fi
    
    # Validate body content if expected
    if [ -n "$expected_key" ] && [ -n "$expected_value" ]; then
        local body_json=$(echo "$body" | jq '.' 2>/dev/null)
        if [ -z "$body_json" ]; then
            return 1
        fi
        local actual_value=$(echo "$body_json" | jq -r ".$expected_key // empty" 2>/dev/null)
        if [ "$actual_value" != "$expected_value" ]; then
            return 1
        fi
    fi
    
    return 0
}

# Function to validate authorizer response
validate_authorizer_response() {
    local response_path=$1
    local expected_effect=$2  # "Allow" or "Deny"
    
    if [ ! -f "$response_path" ]; then
        return 1
    fi
    
    if ! command -v jq &> /dev/null; then
        return 0  # Skip validation if jq not available
    fi
    
    local effect=$(jq -r '.policyDocument.Statement[0].Effect // empty' "$response_path" 2>/dev/null)
    
    if [ "$effect" == "$expected_effect" ]; then
        return 0
    fi
    
    return 1
}

test_lambda_function() {
    local function_name=$1
    local event_file=$2
    local description=$3
    local expected_status=${4:-200}
    local expected_key=${5:-}
    local expected_value=${6:-}
    
    ((TOTAL++))
    echo -e "${BLUE}Testing $function_name - $description${NC}"
    
    local event_path="$EVENTS_DIR/$event_file"
    local response_path="$RESPONSES_DIR/${function_name}-$(basename $event_file .json)-response.json"
    
    if [ ! -f "$event_path" ]; then
        echo -e "${RED}✗ Event file not found: $event_path${NC}"
        ((FAILED++))
        return 1
    fi
    
    # Invoke Lambda function
    local invoke_output
    if invoke_output=$(aws lambda invoke \
        --function-name "$function_name" \
        --payload "file://$event_path" \
        --cli-binary-format raw-in-base64-out \
        "$response_path" 2>&1); then
        
        # Validate response
        if validate_response "$response_path" "$expected_status" "$expected_key" "$expected_value"; then
            echo -e "${GREEN}✓ PASS${NC}"
            
            # Display response summary
            if [ -f "$response_path" ] && command -v jq &> /dev/null; then
                local status_code=$(jq -r '.statusCode // "N/A"' "$response_path" 2>/dev/null)
                echo -e "  Status: ${CYAN}$status_code${NC}"
                local body_preview=$(jq -r '.body // .policyDocument.Statement[0].Effect // "N/A"' "$response_path" 2>/dev/null | head -c 100)
                if [ "$body_preview" != "N/A" ]; then
                    echo -e "  Response: ${CYAN}${body_preview}...${NC}"
                fi
            fi
            
            echo ""
            ((PASSED++))
            return 0
        else
            echo -e "${YELLOW}⚠ INVOKED BUT VALIDATION FAILED${NC}"
            if [ -f "$response_path" ]; then
                echo "Response:"
                cat "$response_path" | jq '.' 2>/dev/null || cat "$response_path"
            fi
            echo ""
            ((FAILED++))
            return 1
        fi
    else
        echo -e "${RED}✗ FAIL - Lambda invocation failed${NC}"
        echo "Error: $invoke_output"
        echo ""
        ((FAILED++))
        return 1
    fi
}

test_authorizer_function() {
    local function_name=$1
    local event_file=$2
    local description=$3
    local expected_effect=$4  # "Allow" or "Deny"
    
    ((TOTAL++))
    echo -e "${BLUE}Testing $function_name - $description${NC}"
    
    local event_path="$EVENTS_DIR/$event_file"
    local response_path="$RESPONSES_DIR/${function_name}-$(basename $event_file .json)-response.json"
    
    if [ ! -f "$event_path" ]; then
        echo -e "${RED}✗ Event file not found: $event_path${NC}"
        ((FAILED++))
        return 1
    fi
    
    # Invoke Lambda function
    local invoke_output
    if invoke_output=$(aws lambda invoke \
        --function-name "$function_name" \
        --payload "file://$event_path" \
        --cli-binary-format raw-in-base64-out \
        "$response_path" 2>&1); then
        
        # Validate authorizer response
        if validate_authorizer_response "$response_path" "$expected_effect"; then
            echo -e "${GREEN}✓ PASS${NC}"
            
            if [ -f "$response_path" ] && command -v jq &> /dev/null; then
                local effect=$(jq -r '.policyDocument.Statement[0].Effect // "N/A"' "$response_path" 2>/dev/null)
                echo -e "  Effect: ${CYAN}$effect${NC}"
            fi
            
            echo ""
            ((PASSED++))
            return 0
        else
            echo -e "${YELLOW}⚠ INVOKED BUT VALIDATION FAILED${NC}"
            if [ -f "$response_path" ]; then
                echo "Response:"
                cat "$response_path" | jq '.' 2>/dev/null || cat "$response_path"
            fi
            echo ""
            ((FAILED++))
            return 1
        fi
    else
        echo -e "${RED}✗ FAIL - Lambda invocation failed${NC}"
        echo "Error: $invoke_output"
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

# Get authorizer function name from Terraform output or use default
AUTHORIZER_FUNCTION=""
if command -v terraform &> /dev/null && [ -d "terraform" ]; then
    cd terraform
    AUTHORIZER_FUNCTION=$(terraform output -raw authorizer_function_name 2>/dev/null || echo "")
    cd ..
fi

# Fallback to default naming pattern if terraform output not available
if [ -z "$AUTHORIZER_FUNCTION" ]; then
    # Try to get from AWS or use pattern
    AUTHORIZER_FUNCTION=$(aws lambda list-functions --query 'Functions[?contains(FunctionName, `authorizer`)].FunctionName' --output text 2>/dev/null | head -n1)
    if [ -z "$AUTHORIZER_FUNCTION" ]; then
        echo -e "${YELLOW}Warning: Could not determine authorizer function name. Skipping authorizer tests.${NC}"
        echo -e "${YELLOW}You can manually specify it by setting AUTHORIZER_FUNCTION environment variable.${NC}"
        echo ""
    fi
fi

# Define functions to test
FUNCTIONS=("onConnect" "onDisconnect" "sendMessage")

# Filter by function name if provided
if [ -n "$FUNCTION_NAME" ]; then
    if [[ " ${FUNCTIONS[@]} " =~ " ${FUNCTION_NAME} " ]] || [ "$FUNCTION_NAME" == "authorizer" ]; then
        if [ "$FUNCTION_NAME" == "authorizer" ]; then
            FUNCTIONS=("authorizer")
        else
            FUNCTIONS=("$FUNCTION_NAME")
        fi
    else
        echo -e "${RED}Error: Function '$FUNCTION_NAME' not found${NC}"
        echo -e "${YELLOW}Available functions: ${FUNCTIONS[*]} authorizer${NC}"
        exit 1
    fi
fi

# Run tests
for func in "${FUNCTIONS[@]}"; do
    case $func in
        "onConnect")
            test_lambda_function "onConnect" "onConnect-event.json" "with username" "200"
            test_lambda_function "onConnect" "onConnect-event-no-username.json" "without username (anonymous)" "200"
            test_lambda_function "onConnect" "onConnect-event-invalid-username.json" "invalid username format" "400"
            test_lambda_function "onConnect" "onConnect-event-with-authorizer.json" "with authorizer context" "200"
            ;;
        "onDisconnect")
            test_lambda_function "onDisconnect" "onDisconnect-event.json" "disconnect event" "200"
            ;;
        "sendMessage")
            test_lambda_function "sendMessage" "sendMessage-event.json" "with username" "200"
            test_lambda_function "sendMessage" "sendMessage-event-anonymous.json" "anonymous user" "200"
            test_lambda_function "sendMessage" "sendMessage-event-empty.json" "empty message (should fail)" "400"
            test_lambda_function "sendMessage" "sendMessage-event-too-long.json" "message too long (should fail)" "400"
            test_lambda_function "sendMessage" "sendMessage-event-get-history.json" "get history action" "200"
            test_lambda_function "sendMessage" "sendMessage-event-invalid-json.json" "invalid JSON body (should fail)" "400"
            ;;
        "authorizer")
            if [ -n "$AUTHORIZER_FUNCTION" ]; then
                test_authorizer_function "$AUTHORIZER_FUNCTION" "authorizer-event-valid.json" "valid username" "Allow"
                test_authorizer_function "$AUTHORIZER_FUNCTION" "authorizer-event-anonymous.json" "anonymous (no username)" "Allow"
                test_authorizer_function "$AUTHORIZER_FUNCTION" "authorizer-event-invalid-empty.json" "empty username (should deny)" "Deny"
                test_authorizer_function "$AUTHORIZER_FUNCTION" "authorizer-event-invalid-too-short.json" "username too short (should deny)" "Deny"
                test_authorizer_function "$AUTHORIZER_FUNCTION" "authorizer-event-invalid-too-long.json" "username too long (should deny)" "Deny"
                test_authorizer_function "$AUTHORIZER_FUNCTION" "authorizer-event-invalid-special-chars.json" "invalid special characters (should deny)" "Deny"
                test_authorizer_function "$AUTHORIZER_FUNCTION" "authorizer-event-invalid-xss.json" "XSS attempt (should deny)" "Deny"
            fi
            ;;
    esac
done

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Total Tests: ${CYAN}$TOTAL${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $PASSED -gt 0 ] && [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
elif [ $PASSED -gt 0 ]; then
    echo -e "${YELLOW}Some tests failed.${NC}"
else
    echo -e "${RED}All tests failed!${NC}"
fi

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

# PowerShell Test Script for Lambda Functions
# Usage: .\tests\test-lambdas.ps1 [function-name]

param(
    [string]$FunctionName = ""
)

# Colors for output - using Write-Host ForegroundColor parameter instead

$TestResults = @()
$TestsDir = Join-Path $PSScriptRoot "."
$EventsDir = Join-Path $TestsDir "events"
$ResponsesDir = Join-Path $TestsDir "responses"

# Create responses directory if it doesn't exist
if (-not (Test-Path $ResponsesDir)) {
    New-Item -ItemType Directory -Path $ResponsesDir -Force | Out-Null
}

function Test-LambdaFunction {
    param(
        [string]$FunctionName,
        [string]$EventFile,
        [string]$Description
    )
    
    Write-Host "Testing $FunctionName - $Description" -ForegroundColor Cyan
    Write-Host ""
    
    $EventPath = Join-Path $EventsDir $EventFile
    $ResponsePath = Join-Path $ResponsesDir "$FunctionName-response.json"
    
    if (-not (Test-Path $EventPath)) {
        Write-Host "Error: Event file not found: $EventPath" -ForegroundColor Red
        return $false
    }
    
    try {
        # Invoke Lambda function
        $result = aws lambda invoke `
            --function-name $FunctionName `
            --payload "file://$EventPath" `
            --cli-binary-format raw-in-base64-out `
            $ResponsePath 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "PASS: $FunctionName test passed" -ForegroundColor Green
            
            # Display response
            if (Test-Path $ResponsePath) {
                $responseContent = Get-Content $ResponsePath -Raw | ConvertFrom-Json
                Write-Host "Response:" -ForegroundColor Gray
                Write-Host ($responseContent | ConvertTo-Json -Depth 10) -ForegroundColor Gray
            }
            
            Write-Host ""
            return $true
        } else {
            Write-Host "FAIL: $FunctionName test failed" -ForegroundColor Red
            Write-Host "Error: $result" -ForegroundColor Red
            Write-Host ""
            return $false
        }
    } catch {
        Write-Host "ERROR: Error testing $FunctionName : $_" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

function Show-Logs {
    param([string]$FunctionName)
    
    Write-Host "Fetching recent logs for $FunctionName..." -ForegroundColor Cyan
    aws logs tail "/aws/lambda/$FunctionName" --since 10m --format short
    Write-Host ""
}

# Main execution
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Lambda Function Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is available
try {
    $null = aws --version
} catch {
    Write-Host "Error: AWS CLI is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Get function names from Terraform if available
$Functions = @("onConnect", "onDisconnect", "sendMessage")

# Filter by function name if provided
if ($FunctionName -ne "") {
    if ($Functions -contains $FunctionName) {
        $Functions = @($FunctionName)
    } else {
        Write-Host "Error: Function '$FunctionName' not found" -ForegroundColor Red
        Write-Host "Available functions: $($Functions -join ', ')" -ForegroundColor Yellow
        exit 1
    }
}

# Run tests
foreach ($func in $Functions) {
    switch ($func) {
        "onConnect" {
            Test-LambdaFunction -FunctionName "onConnect" -EventFile "onConnect-event.json" -Description "with username"
            Test-LambdaFunction -FunctionName "onConnect" -EventFile "onConnect-event-no-username.json" -Description "without username (anonymous)"
        }
        "onDisconnect" {
            Test-LambdaFunction -FunctionName "onDisconnect" -EventFile "onDisconnect-event.json" -Description "disconnect event"
        }
        "sendMessage" {
            Test-LambdaFunction -FunctionName "sendMessage" -EventFile "sendMessage-event.json" -Description "with username"
            Test-LambdaFunction -FunctionName "sendMessage" -EventFile "sendMessage-event-anonymous.json" -Description 'anonymous user'
        }
    }
}

# Summary
Write-Host ""
$summaryMsg = 'Tests completed. Check responses in: ' + $ResponsesDir
Write-Host $summaryMsg -ForegroundColor Cyan
Write-Host ""


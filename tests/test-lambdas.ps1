# PowerShell Test Script for Lambda Functions
# Usage: .\tests\test-lambdas.ps1 [function-name]

param(
    [string]$FunctionName = ""
)

$TestResults = @()
$TestsDir = Join-Path $PSScriptRoot "."
$EventsDir = Join-Path $TestsDir "events"
$ResponsesDir = Join-Path $TestsDir "responses"

# Create responses directory if it doesn't exist
if (-not (Test-Path $ResponsesDir)) {
    New-Item -ItemType Directory -Path $ResponsesDir -Force | Out-Null
}

$script:Passed = 0
$script:Failed = 0
$script:Total = 0

function Test-LambdaFunction {
    param(
        [string]$FunctionName,
        [string]$EventFile,
        [string]$Description,
        [int]$ExpectedStatus = 200,
        [string]$ExpectedKey = "",
        [string]$ExpectedValue = ""
    )
    
    $script:Total++
    Write-Host "Testing $FunctionName - $Description" -ForegroundColor Cyan
    
    $EventPath = Join-Path $EventsDir $EventFile
    $ResponseFileName = "$FunctionName-$([System.IO.Path]::GetFileNameWithoutExtension($EventFile))-response.json"
    $ResponsePath = Join-Path $ResponsesDir $ResponseFileName
    
    if (-not (Test-Path $EventPath)) {
        Write-Host "  Error: Event file not found: $EventPath" -ForegroundColor Red
        $script:Failed++
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
            # Validate response
            $isValid = Test-Response -ResponsePath $ResponsePath -ExpectedStatus $ExpectedStatus -ExpectedKey $ExpectedKey -ExpectedValue $ExpectedValue
            
            if ($isValid) {
                Write-Host "  PASS" -ForegroundColor Green
                
                # Display response summary
                if (Test-Path $ResponsePath) {
                    try {
                        $responseContent = Get-Content $ResponsePath -Raw | ConvertFrom-Json
                        if ($responseContent.statusCode) {
                            Write-Host "  Status: $($responseContent.statusCode)" -ForegroundColor DarkCyan
                        }
                        if ($responseContent.body) {
                            $bodyObj = $responseContent.body | ConvertFrom-Json -ErrorAction SilentlyContinue
                            if ($bodyObj) {
                                $bodyPreview = ($bodyObj | ConvertTo-Json -Depth 2 -Compress).Substring(0, [Math]::Min(100, ($bodyObj | ConvertTo-Json -Depth 2 -Compress).Length))
                                Write-Host "  Response: $bodyPreview..." -ForegroundColor DarkCyan
                            }
                        }
                    } catch {
                        # Ignore JSON parsing errors for display
                    }
                }
                
                Write-Host ""
                $script:Passed++
                return $true
            } else {
                Write-Host "  WARNING: Invoked but validation failed" -ForegroundColor Yellow
                if (Test-Path $ResponsePath) {
                    Write-Host "Response:" -ForegroundColor Gray
                    $responseContent = Get-Content $ResponsePath -Raw | ConvertFrom-Json
                    Write-Host ($responseContent | ConvertTo-Json -Depth 10) -ForegroundColor Gray
                }
                Write-Host ""
                $script:Failed++
                return $false
            }
        } else {
            Write-Host "  FAIL - Lambda invocation failed" -ForegroundColor Red
            Write-Host "  Error: $result" -ForegroundColor Red
            Write-Host ""
            $script:Failed++
            return $false
        }
    } catch {
        Write-Host "  ERROR: Error testing $FunctionName : $_" -ForegroundColor Red
        Write-Host ""
        $script:Failed++
        return $false
    }
}

function Test-AuthorizerFunction {
    param(
        [string]$FunctionName,
        [string]$EventFile,
        [string]$Description,
        [string]$ExpectedEffect  # "Allow" or "Deny"
    )
    
    $script:Total++
    Write-Host "Testing $FunctionName - $Description" -ForegroundColor Cyan
    
    $EventPath = Join-Path $EventsDir $EventFile
    $ResponseFileName = "$FunctionName-$([System.IO.Path]::GetFileNameWithoutExtension($EventFile))-response.json"
    $ResponsePath = Join-Path $ResponsesDir $ResponseFileName
    
    if (-not (Test-Path $EventPath)) {
        Write-Host "  Error: Event file not found: $EventPath" -ForegroundColor Red
        $script:Failed++
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
            # Validate authorizer response
            $isValid = Test-AuthorizerResponse -ResponsePath $ResponsePath -ExpectedEffect $ExpectedEffect
            
            if ($isValid) {
                Write-Host "  PASS" -ForegroundColor Green
                
                if (Test-Path $ResponsePath) {
                    try {
                        $responseContent = Get-Content $ResponsePath -Raw | ConvertFrom-Json
                        if ($responseContent.policyDocument -and $responseContent.policyDocument.Statement) {
                            $effect = $responseContent.policyDocument.Statement[0].Effect
                            Write-Host "  Effect: $effect" -ForegroundColor DarkCyan
                        }
                    } catch {
                        # Ignore JSON parsing errors
                    }
                }
                
                Write-Host ""
                $script:Passed++
                return $true
            } else {
                Write-Host "  WARNING: Invoked but validation failed" -ForegroundColor Yellow
                if (Test-Path $ResponsePath) {
                    Write-Host "Response:" -ForegroundColor Gray
                    $responseContent = Get-Content $ResponsePath -Raw | ConvertFrom-Json
                    Write-Host ($responseContent | ConvertTo-Json -Depth 10) -ForegroundColor Gray
                }
                Write-Host ""
                $script:Failed++
                return $false
            }
        } else {
            Write-Host "  FAIL - Lambda invocation failed" -ForegroundColor Red
            Write-Host "  Error: $result" -ForegroundColor Red
            Write-Host ""
            $script:Failed++
            return $false
        }
    } catch {
        Write-Host "  ERROR: Error testing $FunctionName : $_" -ForegroundColor Red
        Write-Host ""
        $script:Failed++
        return $false
    }
}

function Test-Response {
    param(
        [string]$ResponsePath,
        [int]$ExpectedStatus,
        [string]$ExpectedKey,
        [string]$ExpectedValue
    )
    
    if (-not (Test-Path $ResponsePath)) {
        return $false
    }
    
    try {
        $responseContent = Get-Content $ResponsePath -Raw | ConvertFrom-Json
        
        # Validate status code if expected
        if ($ExpectedStatus -and $responseContent.statusCode) {
            if ($responseContent.statusCode -ne $ExpectedStatus) {
                return $false
            }
        }
        
        # Validate body content if expected
        if ($ExpectedKey -and $ExpectedValue -and $responseContent.body) {
            try {
                $bodyObj = $responseContent.body | ConvertFrom-Json
                if (-not $bodyObj.$ExpectedKey -or $bodyObj.$ExpectedKey -ne $ExpectedValue) {
                    return $false
                }
            } catch {
                return $false
            }
        }
        
        return $true
    } catch {
        return $false
    }
}

function Test-AuthorizerResponse {
    param(
        [string]$ResponsePath,
        [string]$ExpectedEffect
    )
    
    if (-not (Test-Path $ResponsePath)) {
        return $false
    }
    
    try {
        $responseContent = Get-Content $ResponsePath -Raw | ConvertFrom-Json
        
        if ($responseContent.policyDocument -and $responseContent.policyDocument.Statement) {
            $effect = $responseContent.policyDocument.Statement[0].Effect
            if ($effect -eq $ExpectedEffect) {
                return $true
            }
        }
        
        return $false
    } catch {
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

# Get authorizer function name from Terraform output or use default
$AuthorizerFunction = ""
if (Get-Command terraform -ErrorAction SilentlyContinue) {
    if (Test-Path "terraform") {
        Push-Location terraform
        try {
            $AuthorizerFunction = terraform output -raw authorizer_function_name 2>$null
        } catch {
            # Ignore errors
        }
        Pop-Location
    }
}

# Fallback to default naming pattern if terraform output not available
if (-not $AuthorizerFunction) {
    try {
        $functions = aws lambda list-functions --query 'Functions[?contains(FunctionName, `authorizer`)].FunctionName' --output text 2>$null
        if ($functions) {
            $AuthorizerFunction = ($functions -split "`t")[0]
        }
    } catch {
        # Ignore errors
    }
}

if (-not $AuthorizerFunction) {
    Write-Host "Warning: Could not determine authorizer function name. Skipping authorizer tests." -ForegroundColor Yellow
    Write-Host "You can manually specify it by setting `$env:AUTHORIZER_FUNCTION environment variable." -ForegroundColor Yellow
    Write-Host ""
}

# Get function names
$Functions = @("onConnect", "onDisconnect", "sendMessage")

# Filter by function name if provided
if ($FunctionName -ne "") {
    if ($Functions -contains $FunctionName -or $FunctionName -eq "authorizer") {
        if ($FunctionName -eq "authorizer") {
            $Functions = @("authorizer")
        } else {
            $Functions = @($FunctionName)
        }
    } else {
        Write-Host "Error: Function '$FunctionName' not found" -ForegroundColor Red
        Write-Host "Available functions: $($Functions -join ', ') authorizer" -ForegroundColor Yellow
        exit 1
    }
}

# Run tests
foreach ($func in $Functions) {
    switch ($func) {
        "onConnect" {
            Test-LambdaFunction -FunctionName "onConnect" -EventFile "onConnect-event.json" -Description "with username" -ExpectedStatus 200
            Test-LambdaFunction -FunctionName "onConnect" -EventFile "onConnect-event-no-username.json" -Description "without username (anonymous)" -ExpectedStatus 200
            Test-LambdaFunction -FunctionName "onConnect" -EventFile "onConnect-event-invalid-username.json" -Description "invalid username format" -ExpectedStatus 400
            Test-LambdaFunction -FunctionName "onConnect" -EventFile "onConnect-event-with-authorizer.json" -Description "with authorizer context" -ExpectedStatus 200
        }
        "onDisconnect" {
            Test-LambdaFunction -FunctionName "onDisconnect" -EventFile "onDisconnect-event.json" -Description "disconnect event" -ExpectedStatus 200
        }
        "sendMessage" {
            Test-LambdaFunction -FunctionName "sendMessage" -EventFile "sendMessage-event.json" -Description "with username" -ExpectedStatus 200
            Test-LambdaFunction -FunctionName "sendMessage" -EventFile "sendMessage-event-anonymous.json" -Description "anonymous user" -ExpectedStatus 200
            Test-LambdaFunction -FunctionName "sendMessage" -EventFile "sendMessage-event-empty.json" -Description "empty message (should fail)" -ExpectedStatus 400
            Test-LambdaFunction -FunctionName "sendMessage" -EventFile "sendMessage-event-too-long.json" -Description "message too long (should fail)" -ExpectedStatus 400
            Test-LambdaFunction -FunctionName "sendMessage" -EventFile "sendMessage-event-get-history.json" -Description "get history action" -ExpectedStatus 200
            Test-LambdaFunction -FunctionName "sendMessage" -EventFile "sendMessage-event-invalid-json.json" -Description "invalid JSON body (should fail)" -ExpectedStatus 400
        }
        "authorizer" {
            if ($AuthorizerFunction) {
                Test-AuthorizerFunction -FunctionName $AuthorizerFunction -EventFile "authorizer-event-valid.json" -Description "valid username" -ExpectedEffect "Allow"
                Test-AuthorizerFunction -FunctionName $AuthorizerFunction -EventFile "authorizer-event-anonymous.json" -Description "anonymous (no username)" -ExpectedEffect "Allow"
                Test-AuthorizerFunction -FunctionName $AuthorizerFunction -EventFile "authorizer-event-invalid-empty.json" -Description "empty username (should deny)" -ExpectedEffect "Deny"
                Test-AuthorizerFunction -FunctionName $AuthorizerFunction -EventFile "authorizer-event-invalid-too-short.json" -Description "username too short (should deny)" -ExpectedEffect "Deny"
                Test-AuthorizerFunction -FunctionName $AuthorizerFunction -EventFile "authorizer-event-invalid-too-long.json" -Description "username too long (should deny)" -ExpectedEffect "Deny"
                Test-AuthorizerFunction -FunctionName $AuthorizerFunction -EventFile "authorizer-event-invalid-special-chars.json" -Description "invalid special characters (should deny)" -ExpectedEffect "Deny"
                Test-AuthorizerFunction -FunctionName $AuthorizerFunction -EventFile "authorizer-event-invalid-xss.json" -Description "XSS attempt (should deny)" -ExpectedEffect "Deny"
            }
        }
    }
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Tests: $script:Total" -ForegroundColor DarkCyan
Write-Host "Passed: $script:Passed" -ForegroundColor Green
Write-Host "Failed: $script:Failed" -ForegroundColor Red
Write-Host ""

if ($script:Passed -gt 0 -and $script:Failed -eq 0) {
    Write-Host "All tests passed! ✓" -ForegroundColor Green
} elseif ($script:Passed -gt 0) {
    Write-Host "Some tests failed." -ForegroundColor Yellow
} else {
    Write-Host "All tests failed!" -ForegroundColor Red
}

Write-Host ""
$summaryMsg = 'Test responses saved to: ' + $ResponsesDir
Write-Host $summaryMsg -ForegroundColor Cyan
Write-Host ""
Write-Host "To view logs for a function, run:" -ForegroundColor Gray
Write-Host "  aws logs tail /aws/lambda/<function-name> --follow" -ForegroundColor Gray
Write-Host ""

# Exit with error if any tests failed
if ($script:Failed -gt 0) {
    exit 1
}

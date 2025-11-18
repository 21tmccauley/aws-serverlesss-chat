# Quick Start: Testing Lambda Functions

## 🚀 Run Tests (Windows)

```powershell
# Test all Lambda functions
.\tests\test-lambdas.ps1

# Test a specific function
.\tests\test-lambdas.ps1 -FunctionName onConnect
```

## 🚀 Run Tests (Linux/Mac/Git Bash)

```bash
# Make executable (first time only)
chmod +x tests/test-lambdas.sh

# Test all Lambda functions
./tests/test-lambdas.sh

# Test a specific function
./tests/test-lambdas.sh onConnect
```

## 📋 What Gets Tested

- ✅ **onConnect**: Connection with username, connection without username (anonymous)
- ✅ **onDisconnect**: Disconnection handling
- ✅ **sendMessage**: Message sending with username, anonymous message sending

## 📁 Test Structure

```
tests/
├── events/          # Test inputs (JSON event files)
├── responses/       # Test outputs (auto-generated)
├── test-lambdas.ps1 # Windows test script
└── test-lambdas.sh  # Linux/Mac test script
```

## 🔍 View Results

Test responses are saved to `tests/responses/` directory.

View logs:
```bash
aws logs tail /aws/lambda/onConnect --follow
```

## 📚 More Information

- **Full Guide**: See `tests/README.md`
- **TDD Workflow**: See `tests/TDD_WORKFLOW.md`


# Testing Guide - Getting Started

## ✅ Setup Complete!

Your testing environment is now fully configured and working. All 21 tests are passing!

## 📁 What's Been Set Up

### Configuration Files
- ✅ `vitest.config.ts` - Vitest configuration with jsdom environment
- ✅ `src/test/setup.ts` - Test setup file (runs before each test)
- ✅ `tsconfig.json` - Updated with Vitest types
- ✅ `package.json` - Test scripts added

### Test Files Created
- ✅ `src/utils/__tests__/username.test.ts` - 14 tests for username utilities
- ✅ `src/components/__tests__/UsernameDialog.test.tsx` - 7 tests for UsernameDialog component

## 🚀 Available Commands

```bash
# Run tests in watch mode (recommended during development)
npm test

# Run tests once
npm test -- --run

# Run tests with coverage report
npm run test:coverage

# Run tests with UI (visual test runner)
npm run test:ui

# Run tests in watch mode
npm run test:watch
```

## 📚 Test Examples to Study

### 1. Utility Function Tests (`username.test.ts`)
Learn how to test:
- ✅ Pure functions (functions without side effects)
- ✅ localStorage interactions
- ✅ Input validation
- ✅ Edge cases (empty strings, too long, special characters)
- ✅ Multiple test cases for the same function (using `describe` blocks)

**Key Concepts:**
- `describe()` - Groups related tests
- `it()` or `test()` - Individual test case
- `expect()` - Assertions (what you're checking)
- `beforeEach()` - Runs before each test (cleanup)

### 2. React Component Tests (`UsernameDialog.test.tsx`)
Learn how to test:
- ✅ Component rendering
- ✅ User interactions (typing, clicking)
- ✅ Form submissions
- ✅ Conditional rendering (when `isOpen` is false)
- ✅ Callback functions (`onConfirm`, `onClose`)

**Key Concepts:**
- `render()` - Renders React component
- `screen` - Queries the rendered component
- `getByRole()`, `getByText()`, `getByLabelText()` - Ways to find elements
- `userEvent` - Simulates user interactions
- `waitFor()` - Waits for async updates

## 🎯 Next Steps: Writing Your Own Tests

### Exercise 1: Test the `validateUsername` function
The `validateUsername` function has tests, but try adding:
- Test for username with only spaces
- Test for username at exactly 2 characters (boundary)
- Test for username at exactly 20 characters (boundary)

### Exercise 2: Test a Simple Component
Create a test for a simpler component first. Look at `src/components/MermaidDiagram.tsx` or create a simple button component and test:
- Renders correctly
- Calls onClick handler when clicked
- Shows correct text/label

### Exercise 3: Test `useWebSocket` Hook
This is more advanced! You'll need to:
- Mock the WebSocket API
- Test connection states
- Test message sending/receiving
- Test error handling

### Exercise 4: Test `ChatPage` Component
The most complex component. You'll need to:
- Mock the `useWebSocket` hook
- Test message display
- Test message sending
- Test connection status display

## 📖 Learning Resources

### Testing Library Queries (in order of preference)
1. **`getByRole`** - Best! Accessible and semantic
   ```ts
   screen.getByRole('button', { name: /submit/i })
   screen.getByRole('textbox', { name: /username/i })
   ```

2. **`getByLabelText`** - Good for form inputs
   ```ts
   screen.getByLabelText('Username')
   ```

3. **`getByText`** - For text content
   ```ts
   screen.getByText('Welcome')
   ```

4. **`getByTestId`** - Last resort (add `data-testid` to components)
   ```ts
   screen.getByTestId('submit-button')
   ```

### Common Matchers
```ts
expect(element).toBeInTheDocument()
expect(element).toHaveClass('active')
expect(element).toHaveTextContent('Hello')
expect(element).toBeDisabled()
expect(function).toHaveBeenCalled()
expect(function).toHaveBeenCalledWith('arg1', 'arg2')
expect(value).toBe(5)
expect(value).toEqual({ name: 'test' })
expect(array).toHaveLength(3)
```

### Async Testing
```ts
// Wait for something to appear
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})

// Wait for function to be called
await waitFor(() => {
  expect(mockFunction).toHaveBeenCalled()
})
```

## 🐛 Common Issues & Solutions

### Issue: "localStorage is not defined"
**Solution:** Make sure `environment: 'jsdom'` is in `vitest.config.ts` ✅ (Already fixed!)

### Issue: "Cannot find module"
**Solution:** Check your imports. Make sure file paths are correct.

### Issue: Test passes but component doesn't work in browser
**Solution:** Tests are isolated - they don't catch integration issues. Test in browser too!

### Issue: "Act warnings"
**Solution:** Use `waitFor()` for async updates or `userEvent` which handles this automatically.

## 📊 Coverage Goals

Current coverage: Run `npm run test:coverage` to see!

**Target Coverage:**
- Utilities: 90%+
- Components: 70%+
- Hooks: 80%+
- Overall: 80%+

## 🎓 Testing Philosophy

1. **Test behavior, not implementation** - Test what the user sees/experiences
2. **Test user interactions** - Click, type, submit (what users do)
3. **Test edge cases** - Empty inputs, errors, boundaries
4. **Keep tests simple** - One thing per test
5. **Descriptive test names** - "should do X when Y happens"

## ✨ Practice Challenges

1. ✅ **Easy:** Add 3 more test cases to `username.test.ts`
2. ⭐ **Medium:** Write tests for `clearUsername()` function
3. ⭐⭐ **Hard:** Test the `useWebSocket` hook with mocked WebSocket
4. ⭐⭐⭐ **Expert:** Write E2E test using Playwright (Phase 1, Week 3)

---

**Happy Testing! 🧪**

Remember: The goal isn't 100% coverage - it's confidence that your code works correctly!

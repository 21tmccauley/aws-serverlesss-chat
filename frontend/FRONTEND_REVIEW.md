# Frontend Review & Cleanup Plan

## 📊 Current State Analysis

### ✅ What's Good & Should Be Kept

1. **Core Structure** - Well organized React + TypeScript + Vite setup
2. **Essential Pages:**
   - `Index.tsx` - Landing page with username input ✅
   - `Chat.tsx` - Chat interface (needs WebSocket integration)
   - `NotFound.tsx` - 404 page ✅

3. **UI Components Actually Used:**
   - `Button` - Used in Index and Chat pages
   - `Input` - Used in Index and Chat pages
   - `Card` - Used in Index and Chat pages
   - `Badge` - Used in Chat page for viewer count
   - `Toaster` - Used in App.tsx (for toast notifications)
   - `TooltipProvider` - Used in App.tsx

4. **Styling:**
   - Tailwind CSS with custom design system ✅
   - Custom gradient variants ✅
   - Dark mode support ✅
   - Custom animations ✅

5. **Routing:**
   - React Router setup ✅
   - Proper route structure ✅

### ❌ What Should Be Removed

#### 1. Unused UI Components (50+ components!)
These components are NOT used anywhere in the codebase:
- `accordion.tsx`
- `alert-dialog.tsx`
- `alert.tsx`
- `aspect-ratio.tsx`
- `avatar.tsx`
- `breadcrumb.tsx`
- `calendar.tsx`
- `carousel.tsx`
- `chart.tsx`
- `checkbox.tsx`
- `collapsible.tsx`
- `command.tsx`
- `context-menu.tsx`
- `dialog.tsx`
- `drawer.tsx`
- `dropdown-menu.tsx`
- `form.tsx`
- `hover-card.tsx`
- `input-otp.tsx`
- `label.tsx`
- `menubar.tsx`
- `navigation-menu.tsx`
- `pagination.tsx`
- `popover.tsx`
- `progress.tsx`
- `radio-group.tsx`
- `resizable.tsx`
- `scroll-area.tsx`
- `select.tsx`
- `separator.tsx`
- `sheet.tsx`
- `sidebar.tsx`
- `skeleton.tsx`
- `slider.tsx`
- `switch.tsx`
- `table.tsx`
- `tabs.tsx`
- `textarea.tsx`
- `toggle-group.tsx`
- `toggle.tsx`

**Note:** Some of these might be dependencies of other components (like `form.tsx` uses `label.tsx`), so we need to check dependencies before deleting.

#### 2. Unused Dependencies
- `@tanstack/react-query` - Set up but never actually used for any queries
- `sonner` - Imported as `Sonner` in App.tsx but never used (only `Toaster` is used)
- Many Radix UI packages for unused components:
  - `@radix-ui/react-accordion`
  - `@radix-ui/react-aspect-ratio`
  - `@radix-ui/react-avatar`
  - `@radix-ui/react-checkbox`
  - `@radix-ui/react-collapsible`
  - `@radix-ui/react-context-menu`
  - `@radix-ui/react-dialog` (might be used by command.tsx)
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-hover-card`
  - `@radix-ui/react-label` (might be used by form.tsx)
  - `@radix-ui/react-menubar`
  - `@radix-ui/react-navigation-menu`
  - `@radix-ui/react-popover`
  - `@radix-ui/react-progress`
  - `@radix-ui/react-radio-group`
  - `@radix-ui/react-scroll-area`
  - `@radix-ui/react-select`
  - `@radix-ui/react-separator` (might be used by sidebar.tsx)
  - `@radix-ui/react-slider`
  - `@radix-ui/react-switch`
  - `@radix-ui/react-tabs`
  - `@radix-ui/react-toggle`
  - `@radix-ui/react-toggle-group`
- `cmdk` - Command palette (not used)
- `date-fns` - Date utilities (not used)
- `embla-carousel-react` - Carousel (not used)
- `input-otp` - OTP input (not used)
- `react-day-picker` - Date picker (not used)
- `react-hook-form` - Form handling (not used)
- `react-resizable-panels` - Resizable panels (not used)
- `recharts` - Charts (not used)
- `vaul` - Drawer component (not used)
- `zod` - Schema validation (not used)
- `@hookform/resolvers` - Form resolvers (not used)
- `@tailwindcss/typography` - Typography plugin (not used)
- `lovable-tagger` - Dev tool (not needed)

#### 3. Unused Hooks/Components
- `use-mobile.tsx` - Not imported anywhere
- `NavLink.tsx` - Not imported anywhere

#### 4. Unused Files
- `frontend/README.md` - Contains Lovable-specific instructions (not relevant)
- `frontend/REVIEW.md` - This was a review document, can be archived

### ⚠️ What Needs to Be Fixed/Added

1. **WebSocket Integration** (CRITICAL)
   - Currently mocked in `Chat.tsx`
   - Need to create `useWebSocket.ts` hook
   - Connect to AWS API Gateway WebSocket endpoint

2. **Environment Variables** (CRITICAL)
   - Create `.env` file with WebSocket URL
   - Create `.env.example` template

3. **Remove Unused Imports**
   - Remove `Sonner` import from App.tsx (line 2)
   - Remove `QueryClient` and `QueryClientProvider` if not using React Query

4. **Message Format**
   - Current: `{id, username, text, timestamp}`
   - Backend expects: `{action: "sendMessage", message: "...", username: "..."}`
   - Backend returns: `{username, message, timestamp}`

5. **Connection State**
   - Currently mocked with setTimeout
   - Need real WebSocket connection state management

6. **Viewer Count**
   - Currently random mock data
   - Need to get from backend or WebSocket updates

## 🎯 Recommended Action Plan

### Phase 1: Cleanup (Do First)
1. Remove unused UI components
2. Remove unused dependencies from package.json
3. Remove unused imports from App.tsx
4. Delete unused hook files
5. Clean up README.md

### Phase 2: Integration (Do Second)
1. Create `.env` file structure
2. Create `useWebSocket.ts` hook
3. Integrate WebSocket into Chat.tsx
4. Update message format to match backend
5. Add connection state management
6. Add error handling

### Phase 3: Polish (Do Last)
1. Update viewer count logic
2. Add reconnection logic
3. Improve error messages
4. Test edge cases

## 📝 Component Dependency Map

Before deleting components, check these dependencies:
- `form.tsx` → uses `label.tsx`
- `command.tsx` → uses `dialog.tsx`
- `sidebar.tsx` → uses `button.tsx`, `input.tsx`, `separator.tsx`, `sheet.tsx`, `skeleton.tsx`, `tooltip.tsx`
- `pagination.tsx` → uses `button.tsx`
- `calendar.tsx` → uses `button.tsx`
- `alert-dialog.tsx` → uses `button.tsx`
- `carousel.tsx` → uses `button.tsx`

Since none of these parent components are used, we can safely remove them all.

## 💾 Estimated Size Reduction

- **Components:** ~50 unused component files
- **Dependencies:** ~30 unused npm packages
- **Bundle size:** Significant reduction in final build size
- **Install time:** Faster `npm install`


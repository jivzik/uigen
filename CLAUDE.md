# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

UIGen is an AI-powered React component generator with live preview. It uses Claude (via Anthropic API) to generate React components in real-time through a chat interface, with a virtual file system for in-memory file management and live preview rendering.

## Development Commands

### Setup
```bash
npm run setup              # Install deps + generate Prisma client + run migrations
```

### Development
```bash
npm run dev                # Start Next.js dev server with Turbopack
npm run dev:daemon         # Start dev server in background, logs to logs.txt
```

### Testing
```bash
npm test                   # Run Vitest tests
```

### Database
```bash
npx prisma generate        # Generate Prisma client
npx prisma migrate dev     # Run database migrations
npm run db:reset           # Reset database (force)
```

### Build & Lint
```bash
npm run build              # Production build
npm start                  # Start production server
npm run lint               # Run ESLint
```

### Running Tests

To run all tests:
```bash
npm test
```

To run a specific test file:
```bash
npx vitest src/lib/__tests__/file-system.test.ts
```

To run tests in watch mode:
```bash
npm test -- --watch
```

## Architecture

### Virtual File System

The core of the app is a **VirtualFileSystem** class (`src/lib/file-system.ts`) that maintains an in-memory tree of files and directories. No files are written to disk during component generation.

- Files are stored in a `Map<string, FileNode>` where keys are normalized paths (e.g., `/App.jsx`)
- Supports CRUD operations: create, read, update, delete, rename
- Provides special commands for AI: `viewFile`, `createFileWithParents`, `replaceInFile`, `insertInFile`
- Serializes to/from JSON for persistence in the database

### AI Integration Architecture

The chat API route (`src/app/api/chat/route.ts`) orchestrates AI component generation:

1. **System Prompt**: Injects `generationPrompt` from `src/lib/prompts/generation.tsx` with cache control
2. **Virtual File System**: Serialized and passed with each request
3. **AI Tools**: Two custom tools available to the AI:
   - `str_replace_editor`: Create, view, and edit files (view, create, str_replace, insert)
   - `file_manager`: Rename and delete files
4. **Streaming**: Uses Vercel AI SDK's `streamText` with up to 40 steps (4 for mock provider)
5. **Persistence**: On completion, saves messages and file system state to the database for authenticated users

**Mock Provider**: When `ANTHROPIC_API_KEY` is not set, uses `MockLanguageModel` (src/lib/provider.ts) that generates static Counter, Card, or Form components. This allows the app to run without an API key for demonstration purposes.

### Component Preview System

The preview system transforms virtual files into runnable code in an iframe:

1. **JSX Transformation** (`src/lib/transform/jsx-transformer.ts`):
   - Uses Babel standalone to transpile JSX/TSX to JavaScript
   - Handles React 19 with automatic JSX runtime
   - Detects and removes CSS imports (collected separately)
   - Tracks missing imports for resolution

2. **Import Map Creation**:
   - Transforms all virtual files to blob URLs
   - Builds an import map for module resolution
   - Maps `@/` alias to root directory
   - Loads React from `esm.sh`
   - Handles third-party packages via `esm.sh`
   - Collects CSS files and injects as `<style>` tags

3. **Preview HTML Generation**:
   - Creates a complete HTML document with Tailwind CDN
   - Injects import map as `<script type="importmap">`
   - Includes error boundary for runtime errors
   - Displays syntax errors with file paths and locations
   - Entry point is typically `/App.jsx`

### Context Providers

Two React contexts manage state across the application:

**FileSystemContext** (`src/lib/contexts/file-system-context.tsx`):
- Wraps `VirtualFileSystem` with React state
- Manages selected file for the code editor
- Provides `handleToolCall` to process AI tool calls in the UI
- Triggers re-renders via `refreshTrigger` when files change
- Auto-selects `/App.jsx` or first root file when none selected

**ChatContext** (`src/lib/contexts/chat-context.tsx`):
- Wraps Vercel AI SDK's `useChat` hook
- Sends serialized file system with each request
- Calls `handleToolCall` from FileSystemContext when AI uses tools
- Tracks anonymous work in localStorage via `anon-work-tracker`
- Manages project persistence for authenticated users

### Authentication System

JWT-based authentication (`src/lib/auth.ts`):
- Uses `jose` library for JWT signing/verification
- Session stored in HTTP-only cookie (`auth-token`)
- 7-day expiration
- Server-only module (not exposed to client)
- Middleware (`src/middleware.ts`) protects project routes

### Database Schema

Prisma with SQLite (`prisma/schema.prisma`):
- **User**: id, email, password (bcrypt hashed), timestamps
- **Project**: id, name, userId (nullable for anonymous), messages (JSON), data (JSON), timestamps
- Projects cascade delete when user is deleted
- `messages` stores chat history
- `data` stores serialized VirtualFileSystem

Prisma client is generated to `src/generated/prisma`.

### Component Structure

**Main Editor Layout** (`src/app/[projectId]/page.tsx`):
- Three-panel layout using `react-resizable-panels`
- Left: Chat interface
- Middle: Code editor (Monaco)
- Right: Live preview iframe

**Key Components**:
- `ChatInterface`: Message list, input, markdown rendering
- `FileTree`: Hierarchical file browser
- `CodeEditor`: Monaco editor with syntax highlighting
- `PreviewFrame`: Iframe with transformed and rendered code

### Path Aliasing

The app uses `@/` as an alias for the `src/` directory:
- Configured in `tsconfig.json` with `"@/*": ["./src/*"]`
- Supported in both TypeScript and the preview's import map
- AI tools reference files with `/` prefix (e.g., `/App.jsx`), not `@/`

## Important Implementation Details

### File Path Normalization

All file paths in the VirtualFileSystem are normalized:
- Must start with `/`
- No trailing slash except for root
- Multiple slashes collapsed to single slash
- Example: `App.jsx` → `/App.jsx`

### AI Tool Parameters

**str_replace_editor**:
- `command`: "view" | "create" | "str_replace" | "insert" | "undo_edit"
- `path`: File path (will be normalized)
- `file_text`: Full file content (for "create")
- `old_str`, `new_str`: Strings for replacement (for "str_replace")
- `insert_line`, `new_str`: Line number and text (for "insert")
- `view_range`: Optional [start, end] line range (for "view")

**file_manager**:
- `command`: "rename" | "delete"
- `path`: File/directory path
- `new_path`: New path (for "rename")

### Testing Strategy

Tests use Vitest with `jsdom` environment and React Testing Library:
- Unit tests for VirtualFileSystem operations
- Unit tests for JSX transformer
- Component tests for file tree, chat interface
- Context provider tests with mock data

## Tech Stack Details

- **Next.js 15**: App Router with React Server Components
- **React 19**: Latest with automatic JSX runtime
- **TypeScript**: Strict mode enabled
- **Tailwind CSS v4**: New config format via `@tailwindcss/postcss`
- **Prisma**: ORM with SQLite (generated to custom path)
- **Vercel AI SDK**: `streamText` with tool calling
- **@ai-sdk/anthropic**: Claude Haiku 4.5 (model: "claude-haiku-4-5")
- **Monaco Editor**: VS Code's editor component
- **Babel Standalone**: Client-side JSX transformation
- **esm.sh**: CDN for ES modules in preview

## Common Patterns

### Adding a New AI Tool

1. Create tool builder in `src/lib/tools/`
2. Export function that takes `VirtualFileSystem` and returns tool definition
3. Register in `src/app/api/chat/route.ts` tools object
4. Add handler in `FileSystemContext.handleToolCall` for UI updates

### Adding a New Component Test

1. Create `__tests__` directory next to component
2. Use React Testing Library with `@testing-library/react`
3. Mock contexts as needed (see existing tests for patterns)
4. Import paths use `@/` alias (configured in `vite-tsconfig-paths`)

### Modifying the Generation Prompt

Edit `src/lib/prompts/generation.tsx`. This prompt is injected as a system message with Anthropic's prompt caching for efficiency.
- Use comments sparingly. Only comment complex code.
- The database schema is defined in the @prisma/schema.prisma file. Reference it anytime you need to understand the structure of data stored in the database.
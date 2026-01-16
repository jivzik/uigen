import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

describe("ToolInvocationBadge", () => {
  describe("str_replace_editor tool", () => {
    it("should display 'Creating' message for create command", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            state: "call",
            args: {
              command: "create",
              path: "/App.jsx",
            },
          }}
        />
      );

      expect(screen.getByText(/Creating/)).toBeDefined();
      expect(screen.getByText(/\/App\.jsx/)).toBeDefined();
    });

    it("should display 'Viewing' message for view command", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            state: "call",
            args: {
              command: "view",
              path: "/components/Button.tsx",
            },
          }}
        />
      );

      expect(screen.getByText(/Viewing/)).toBeDefined();
      expect(screen.getByText(/\/components\/Button\.tsx/)).toBeDefined();
    });

    it("should display 'Editing' message for str_replace command", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            state: "call",
            args: {
              command: "str_replace",
              path: "/App.jsx",
              old_str: "old",
              new_str: "new",
            },
          }}
        />
      );

      expect(screen.getByText(/Editing/)).toBeDefined();
      expect(screen.getByText(/\/App\.jsx/)).toBeDefined();
    });

    it("should display 'Editing' message for insert command", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            state: "call",
            args: {
              command: "insert",
              path: "/utils/helper.ts",
              insert_line: 10,
              new_str: "code",
            },
          }}
        />
      );

      expect(screen.getByText(/Editing/)).toBeDefined();
      expect(screen.getByText(/\/utils\/helper\.ts/)).toBeDefined();
    });

    it("should display 'Undoing changes' message for undo_edit command", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            state: "call",
            args: {
              command: "undo_edit",
              path: "/App.jsx",
            },
          }}
        />
      );

      expect(screen.getByText(/Undoing changes to/)).toBeDefined();
      expect(screen.getByText(/\/App\.jsx/)).toBeDefined();
    });
  });

  describe("file_manager tool", () => {
    it("should display 'Deleting' message for delete command", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "file_manager",
            state: "call",
            args: {
              command: "delete",
              path: "/old-file.jsx",
            },
          }}
        />
      );

      expect(screen.getByText(/Deleting/i)).toBeDefined();
      expect(screen.getByText(/\/old-file\.jsx/)).toBeDefined();
    });

    it("should display 'Renaming' message with arrow for rename command", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "file_manager",
            state: "call",
            args: {
              command: "rename",
              path: "/Button.jsx",
              new_path: "/components/Button.jsx",
            },
          }}
        />
      );

      expect(screen.getByText(/Renaming/i)).toBeDefined();
      expect(screen.getByText(/\/Button\.jsx → \/components\/Button\.jsx/)).toBeDefined();
    });
  });

  describe("loading states", () => {
    it("should show loading spinner when state is 'call'", () => {
      const { container } = render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            state: "call",
            args: {
              command: "create",
              path: "/App.jsx",
            },
          }}
        />
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).not.toBeNull();
    });

    it("should show loading spinner when state is 'partial-call'", () => {
      const { container } = render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            state: "partial-call",
            args: {
              command: "create",
              path: "/App.jsx",
            },
          }}
        />
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).not.toBeNull();
    });

    it("should show success indicator when state is 'result'", () => {
      const { container } = render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            state: "result",
            args: {
              command: "create",
              path: "/App.jsx",
            },
            result: { success: true },
          }}
        />
      );

      const successDot = container.querySelector(".bg-emerald-500");
      expect(successDot).not.toBeNull();

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeNull();
    });
  });

  describe("fallback for unknown tools", () => {
    it("should display raw tool name for unknown tool", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "unknown_tool",
            state: "call",
            args: {
              command: "test",
            },
          }}
        />
      );

      expect(screen.getByText("unknown_tool")).toBeDefined();
    });

    it("should display raw tool name when args are missing", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            state: "call",
          }}
        />
      );

      expect(screen.getByText("str_replace_editor")).toBeDefined();
    });

    it("should show loading spinner for unknown tool in call state", () => {
      const { container } = render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "unknown_tool",
            state: "call",
            args: {},
          }}
        />
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).not.toBeNull();
    });

    it("should show success indicator for unknown tool in result state", () => {
      const { container } = render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "unknown_tool",
            state: "result",
            args: {},
            result: { success: true },
          }}
        />
      );

      const successDot = container.querySelector(".bg-emerald-500");
      expect(successDot).not.toBeNull();
    });
  });

  describe("styling", () => {
    it("should have correct CSS classes", () => {
      const { container } = render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            state: "call",
            args: {
              command: "create",
              path: "/App.jsx",
            },
          }}
        />
      );

      const badge = container.querySelector(".bg-neutral-50");
      expect(badge).not.toBeNull();
      expect(badge?.classList.contains("rounded-lg")).toBe(true);
      expect(badge?.classList.contains("text-xs")).toBe(true);
      expect(badge?.classList.contains("border")).toBe(true);
      expect(badge?.classList.contains("border-neutral-200")).toBe(true);
    });

    it("should display file path in monospace font", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            state: "call",
            args: {
              command: "create",
              path: "/App.jsx",
            },
          }}
        />
      );

      const monoPath = screen.getByText(/\/App\.jsx/);
      expect(monoPath.classList.contains("font-mono")).toBe(true);
    });
  });
});
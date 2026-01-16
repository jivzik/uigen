import { describe, it, expect } from "vitest";
import { getToolMessage } from "../tool-messages";
import { Eye, FilePlus, Edit, Undo, FileInput, Trash2 } from "lucide-react";

describe("getToolMessage", () => {
  describe("str_replace_editor tool", () => {
    it("should return correct message for view command", () => {
      const result = getToolMessage({
        toolName: "str_replace_editor",
        state: "call",
        args: {
          command: "view",
          path: "/App.jsx",
        },
      });

      expect(result).toEqual({
        action: "Viewing",
        target: "/App.jsx",
        icon: Eye,
      });
    });

    it("should return correct message for create command", () => {
      const result = getToolMessage({
        toolName: "str_replace_editor",
        state: "call",
        args: {
          command: "create",
          path: "/components/Button.tsx",
          file_text: "export default function Button() {}",
        },
      });

      expect(result).toEqual({
        action: "Creating",
        target: "/components/Button.tsx",
        icon: FilePlus,
      });
    });

    it("should return correct message for str_replace command", () => {
      const result = getToolMessage({
        toolName: "str_replace_editor",
        state: "call",
        args: {
          command: "str_replace",
          path: "/App.jsx",
          old_str: "old code",
          new_str: "new code",
        },
      });

      expect(result).toEqual({
        action: "Editing",
        target: "/App.jsx",
        icon: Edit,
      });
    });

    it("should return correct message for insert command", () => {
      const result = getToolMessage({
        toolName: "str_replace_editor",
        state: "call",
        args: {
          command: "insert",
          path: "/utils/helper.ts",
          insert_line: 10,
          new_str: "console.log('test');",
        },
      });

      expect(result).toEqual({
        action: "Editing",
        target: "/utils/helper.ts",
        icon: Edit,
      });
    });

    it("should return correct message for undo_edit command", () => {
      const result = getToolMessage({
        toolName: "str_replace_editor",
        state: "call",
        args: {
          command: "undo_edit",
          path: "/App.jsx",
        },
      });

      expect(result).toEqual({
        action: "Undoing changes to",
        target: "/App.jsx",
        icon: Undo,
      });
    });

    it("should handle nested file paths", () => {
      const result = getToolMessage({
        toolName: "str_replace_editor",
        state: "call",
        args: {
          command: "create",
          path: "/components/ui/forms/Input.tsx",
        },
      });

      expect(result?.target).toBe("/components/ui/forms/Input.tsx");
    });
  });

  describe("file_manager tool", () => {
    it("should return correct message for delete command", () => {
      const result = getToolMessage({
        toolName: "file_manager",
        state: "call",
        args: {
          command: "delete",
          path: "/old-component.jsx",
        },
      });

      expect(result).toEqual({
        action: "Deleting",
        target: "/old-component.jsx",
        icon: Trash2,
      });
    });

    it("should return correct message for rename command with new_path", () => {
      const result = getToolMessage({
        toolName: "file_manager",
        state: "call",
        args: {
          command: "rename",
          path: "/Button.jsx",
          new_path: "/components/Button.jsx",
        },
      });

      expect(result).toEqual({
        action: "Renaming",
        target: "/Button.jsx → /components/Button.jsx",
        icon: FileInput,
      });
    });

    it("should return correct message for rename command without new_path", () => {
      const result = getToolMessage({
        toolName: "file_manager",
        state: "call",
        args: {
          command: "rename",
          path: "/Button.jsx",
        },
      });

      expect(result).toEqual({
        action: "Renaming",
        target: "/Button.jsx",
        icon: FileInput,
      });
    });
  });

  describe("edge cases", () => {
    it("should return null for unknown tool", () => {
      const result = getToolMessage({
        toolName: "unknown_tool",
        state: "call",
        args: {
          command: "test",
          path: "/test.jsx",
        },
      });

      expect(result).toBeNull();
    });

    it("should return null when args is undefined", () => {
      const result = getToolMessage({
        toolName: "str_replace_editor",
        state: "call",
      });

      expect(result).toBeNull();
    });

    it("should return null when args is missing required fields", () => {
      const result = getToolMessage({
        toolName: "str_replace_editor",
        state: "call",
        args: {
          command: "view",
        },
      });

      expect(result).toBeNull();
    });

    it("should return null when args has invalid types", () => {
      const result = getToolMessage({
        toolName: "str_replace_editor",
        state: "call",
        args: {
          command: 123,
          path: "/test.jsx",
        },
      });

      expect(result).toBeNull();
    });
  });

  describe("state handling", () => {
    it("should return same message regardless of state", () => {
      const callResult = getToolMessage({
        toolName: "str_replace_editor",
        state: "call",
        args: { command: "create", path: "/App.jsx" },
      });

      const resultResult = getToolMessage({
        toolName: "str_replace_editor",
        state: "result",
        args: { command: "create", path: "/App.jsx" },
        result: { success: true },
      });

      const partialResult = getToolMessage({
        toolName: "str_replace_editor",
        state: "partial-call",
        args: { command: "create", path: "/App.jsx" },
      });

      expect(callResult).toEqual(resultResult);
      expect(callResult).toEqual(partialResult);
    });
  });
});
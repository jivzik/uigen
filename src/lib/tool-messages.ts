import { LucideIcon, Eye, FilePlus, Edit, Undo, FileInput, Trash2, FileText } from "lucide-react";

export interface ToolMessageConfig {
  action: string;
  target: string;
  icon: LucideIcon;
}

interface ToolInvocation {
  toolName: string;
  state: "call" | "result" | "partial-call";
  args?: Record<string, unknown>;
  result?: unknown;
}

interface StrReplaceArgs {
  command: "view" | "create" | "str_replace" | "insert" | "undo_edit";
  path: string;
  file_text?: string;
  insert_line?: number;
  new_str?: string;
  old_str?: string;
  view_range?: [number, number];
}

interface FileManagerArgs {
  command: "rename" | "delete";
  path: string;
  new_path?: string;
}

function isStrReplaceArgs(args: Record<string, unknown>): args is StrReplaceArgs {
  return typeof args.command === "string" && typeof args.path === "string";
}

function isFileManagerArgs(args: Record<string, unknown>): args is FileManagerArgs {
  return (
    typeof args.command === "string" &&
    (args.command === "rename" || args.command === "delete") &&
    typeof args.path === "string"
  );
}

function getStrReplaceMessage(args: StrReplaceArgs): ToolMessageConfig {
  const { command, path } = args;

  switch (command) {
    case "view":
      return {
        action: "Viewing",
        target: path,
        icon: Eye,
      };
    case "create":
      return {
        action: "Creating",
        target: path,
        icon: FilePlus,
      };
    case "str_replace":
      return {
        action: "Editing",
        target: path,
        icon: Edit,
      };
    case "insert":
      return {
        action: "Editing",
        target: path,
        icon: Edit,
      };
    case "undo_edit":
      return {
        action: "Undoing changes to",
        target: path,
        icon: Undo,
      };
    default:
      return {
        action: "Modifying",
        target: path,
        icon: FileText,
      };
  }
}

function getFileManagerMessage(args: FileManagerArgs): ToolMessageConfig {
  const { command, path, new_path } = args;

  switch (command) {
    case "rename":
      return {
        action: "Renaming",
        target: new_path ? `${path} → ${new_path}` : path,
        icon: FileInput,
      };
    case "delete":
      return {
        action: "Deleting",
        target: path,
        icon: Trash2,
      };
    default:
      return {
        action: "Managing",
        target: path,
        icon: FileText,
      };
  }
}

export function getToolMessage(toolInvocation: ToolInvocation): ToolMessageConfig | null {
  const { toolName, args } = toolInvocation;

  if (!args) {
    return null;
  }

  if (toolName === "str_replace_editor" && isStrReplaceArgs(args)) {
    return getStrReplaceMessage(args);
  }

  if (toolName === "file_manager" && isFileManagerArgs(args)) {
    return getFileManagerMessage(args);
  }

  return null;
}
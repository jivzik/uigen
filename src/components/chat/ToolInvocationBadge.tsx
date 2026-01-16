"use client";

import { Loader2 } from "lucide-react";
import { getToolMessage } from "@/lib/tool-messages";

interface ToolInvocation {
  toolName: string;
  state: "call" | "result" | "partial-call";
  args?: Record<string, unknown>;
  result?: unknown;
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const messageConfig = getToolMessage(toolInvocation);
  const isComplete = toolInvocation.state === "result";

  if (!messageConfig) {
    return (
      <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
        {isComplete ? (
          <>
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-neutral-700">{toolInvocation.toolName}</span>
          </>
        ) : (
          <>
            <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
            <span className="text-neutral-700">{toolInvocation.toolName}</span>
          </>
        )}
      </div>
    );
  }

  const Icon = messageConfig.icon;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isComplete ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <Icon className="w-3 h-3 text-neutral-600" />
          <span className="text-neutral-700">
            {messageConfig.action} <span className="font-mono">{messageConfig.target}</span>
          </span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <Icon className="w-3 h-3 text-neutral-600" />
          <span className="text-neutral-700">
            {messageConfig.action} <span className="font-mono">{messageConfig.target}</span>
          </span>
        </>
      )}
    </div>
  );
}
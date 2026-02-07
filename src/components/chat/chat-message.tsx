"use client";

import { cn } from "@/lib/utils";
import { Bot, User, Bell } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  messageType?: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  isLoading?: boolean;
}

/**
 * Parse markdown-style links [text](url) and render them as clickable links
 */
function parseContentWithLinks(content: string): React.ReactNode[] {
  // Regex to match markdown links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    // Add the link
    const [, linkText, linkUrl] = match;
    parts.push(
      <Link
        key={`link-${match.index}`}
        href={linkUrl}
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
      >
        {linkText}
      </Link>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts;
}

/**
 * Parse content with bold markdown (**text**) and links
 */
function parseContentWithFormatting(content: string): React.ReactNode[] {
  const lines = content.split("\n");
  const result: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      result.push(<br key={`br-${lineIndex}`} />);
    }

    // First, parse bold markers
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(line)) !== null) {
      // Add text before the bold (with link parsing)
      if (match.index > lastIndex) {
        const textBefore = line.substring(lastIndex, match.index);
        parts.push(...parseContentWithLinks(textBefore));
      }

      // Add the bold text
      parts.push(
        <strong key={`bold-${lineIndex}-${match.index}`}>
          {match[1]}
        </strong>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text (with link parsing)
    if (lastIndex < line.length) {
      const remaining = line.substring(lastIndex);
      parts.push(...parseContentWithLinks(remaining));
    } else if (parts.length === 0) {
      // If no bold markers, parse the whole line for links
      parts.push(...parseContentWithLinks(line));
    }

    result.push(...parts);
  });

  return result;
}

export function ChatMessage({ role, messageType = "ASSISTANT", content, isLoading }: ChatMessageProps) {
  const isUser = role === "user";
  const isSystem = messageType === "SYSTEM";

  // Parse content with links and formatting for system messages
  const formattedContent = useMemo(() => {
    if (isSystem) {
      return parseContentWithFormatting(content);
    }
    return content;
  }, [content, isSystem]);

  // System messages have special styling
  if (isSystem) {
    return (
      <div className="p-4">
        <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 text-sm text-gray-800 dark:text-gray-200">
              {isLoading ? (
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{formattedContent}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-3 p-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2",
          isUser
            ? "bg-blue-600 text-white rounded-tr-sm"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm"
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        )}
      </div>
    </div>
  );
}

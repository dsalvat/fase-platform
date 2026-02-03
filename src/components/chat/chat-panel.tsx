"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { sendChatMessage, getCreditsRemaining, getConversationMessages } from "@/app/actions/chat";
import { MessageCircle, Trash2, Plus } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  translations: {
    title: string;
    placeholder: string;
    credits: string;
    creditsRemaining: string;
    noCredits: string;
    thinking: string;
    error: string;
    newConversation: string;
    welcome: string;
  };
}

export function ChatPanel({ open, onOpenChange, translations: t }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch credits on open
  useEffect(() => {
    if (open) {
      fetchCredits();
    }
  }, [open]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchCredits = async () => {
    const result = await getCreditsRemaining();
    if (result.success) {
      setCreditsRemaining(result.creditsRemaining);
    }
  };

  const loadConversation = useCallback(async (convId: string) => {
    const result = await getConversationMessages(convId);
    if (result.success && result.messages) {
      setMessages(result.messages.map(msg => ({
        ...msg,
        role: msg.role as "user" | "assistant",
      })));
      setConversationId(convId);
    }
  }, []);

  const handleSend = async (content: string) => {
    if (creditsRemaining <= 0) {
      setError("noCredits");
      return;
    }

    // Add user message optimistically
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const result = await sendChatMessage(content, conversationId);

      if (result.success && result.message) {
        // Update conversation ID if new conversation
        if (result.conversationId) {
          setConversationId(result.conversationId);
        }

        // Add assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: result.message!.id,
            role: result.message!.role as "user" | "assistant",
            content: result.message!.content,
            createdAt: result.message!.createdAt,
          },
        ]);

        // Update credits
        if (result.creditsRemaining !== undefined) {
          setCreditsRemaining(result.creditsRemaining);
        }
      } else {
        setError(result.error || "Error al enviar mensaje");
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      }
    } catch {
      setError("Error al enviar mensaje");
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  };

  const noCredits = creditsRemaining <= 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <SheetTitle>{t.title}</SheetTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={noCredits ? "destructive" : "secondary"}>
                {creditsRemaining}/10 {t.credits}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewConversation}
                title={t.newConversation}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-sm">{t.welcome}</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                />
              ))}
              {isLoading && (
                <ChatMessage role="assistant" content="" isLoading />
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
            {error === "noCredits" ? t.noCredits : t.error}
          </div>
        )}

        {/* No credits warning */}
        {noCredits && !error && (
          <div className="px-4 py-2 bg-yellow-50 text-yellow-700 text-sm">
            {t.noCredits}
          </div>
        )}

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          disabled={isLoading || noCredits}
          placeholder={t.placeholder}
        />
      </SheetContent>
    </Sheet>
  );
}

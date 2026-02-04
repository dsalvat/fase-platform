"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import {
  sendChatMessage,
  getCreditsRemaining,
  getConversationMessages,
  getConversations,
  markMessagesAsRead,
  deleteConversation,
} from "@/app/actions/chat";
import { MessageCircle, Plus, History, Trash2, ChevronDown } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  messageType: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: Date;
}

interface Conversation {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
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
    conversationHistory?: string;
    noConversations?: string;
    deleteConversation?: string;
  };
  onMessagesRead?: () => void;
}

export function ChatPanel({ open, onOpenChange, translations: t, onMessagesRead }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [creditsRemaining, setCreditsRemaining] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch credits and conversations on open
  useEffect(() => {
    if (open) {
      fetchCredits();
      fetchConversations();
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

  const fetchConversations = async () => {
    const result = await getConversations();
    if (result.success && result.conversations) {
      setConversations(result.conversations);
    }
  };

  const loadConversation = useCallback(async (convId: string) => {
    const result = await getConversationMessages(convId);
    if (result.success && result.messages) {
      setMessages(result.messages.map(msg => ({
        ...msg,
        role: msg.role as "user" | "assistant",
        messageType: (msg.messageType || "ASSISTANT") as "USER" | "ASSISTANT" | "SYSTEM",
      })));
      setConversationId(convId);

      // Mark messages as read
      await markMessagesAsRead(convId);
      onMessagesRead?.();
    }
  }, [onMessagesRead]);

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await deleteConversation(convId);
    if (result.success) {
      // Refresh conversations list
      fetchConversations();
      // If we deleted the current conversation, clear it
      if (convId === conversationId) {
        handleNewConversation();
      }
    }
  };

  const handleSend = async (content: string) => {
    if (creditsRemaining <= 0) {
      setError("noCredits");
      return;
    }

    // Add user message optimistically
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      messageType: "USER",
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
          // Refresh conversations list
          fetchConversations();
        }

        // Add assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: result.message!.id,
            role: result.message!.role as "user" | "assistant",
            messageType: "ASSISTANT" as const,
            content: result.message!.content,
            createdAt: result.message!.createdAt,
          },
        ]);

        // Update credits
        if (result.creditsRemaining !== undefined) {
          setCreditsRemaining(result.creditsRemaining);
        }

        // Mark as read immediately since user is viewing
        if (result.conversationId) {
          await markMessagesAsRead(result.conversationId);
          onMessagesRead?.();
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

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Ayer";
    } else if (days < 7) {
      return d.toLocaleDateString([], { weekday: "short" });
    } else {
      return d.toLocaleDateString([], { day: "numeric", month: "short" });
    }
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
            <div className="flex items-center gap-2 mr-6">
              {creditsRemaining < 3 && (
                <Badge variant={noCredits ? "destructive" : "secondary"} className="text-xs">
                  {creditsRemaining}/10 {t.credits}
                </Badge>
              )}

              {/* Conversation History Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" title={t.conversationHistory || "Historial"}>
                    <History className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    {t.conversationHistory || "Conversaciones"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {conversations.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-gray-500">
                      {t.noConversations || "No hay conversaciones"}
                    </div>
                  ) : (
                    conversations.slice(0, 10).map((conv) => (
                      <DropdownMenuItem
                        key={conv.id}
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => loadConversation(conv.id)}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="text-sm font-medium truncate">
                            {conv.title || "Nueva conversación"}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>{formatDate(conv.updatedAt)}</span>
                            <span>·</span>
                            <span>{conv.messageCount} msgs</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-gray-400 hover:text-red-500"
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                          title={t.deleteConversation || "Eliminar"}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

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
                  messageType={message.messageType}
                  content={message.content}
                />
              ))}
              {isLoading && (
                <ChatMessage role="assistant" messageType="ASSISTANT" content="" isLoading />
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

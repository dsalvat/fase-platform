"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { ChatPanel } from "./chat-panel";
import { getUnreadCount, generateSystemNotification } from "@/app/actions/chat";

interface ChatButtonProps {
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

export function ChatButton({ translations }: ChatButtonProps) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notificationGenerated, setNotificationGenerated] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    const result = await getUnreadCount();
    if (result.success) {
      setUnreadCount(result.count);
    }
  }, []);

  useEffect(() => {
    // Fetch unread count on mount
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const handleOpenChange = async (newOpen: boolean) => {
    if (newOpen && !notificationGenerated) {
      // Generate system notification when opening chat for first time
      const result = await generateSystemNotification();
      setNotificationGenerated(true);

      if (result.success && result.hasNotification) {
        // Refresh unread count after notification
        fetchUnreadCount();
      }
    }
    setOpen(newOpen);
  };

  const handleMessagesRead = () => {
    // Called when messages are marked as read
    fetchUnreadCount();
  };

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => handleOpenChange(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-40"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Chat panel */}
      <ChatPanel
        open={open}
        onOpenChange={(newOpen) => handleOpenChange(newOpen)}
        translations={translations}
        onMessagesRead={handleMessagesRead}
      />
    </>
  );
}

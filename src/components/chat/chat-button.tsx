"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { ChatPanel } from "./chat-panel";
import { getCreditsRemaining } from "@/app/actions/chat";

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
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  useEffect(() => {
    // Fetch credits on mount
    const fetchCredits = async () => {
      const result = await getCreditsRemaining();
      if (result.success) {
        setCreditsRemaining(result.creditsRemaining);
      }
    };
    fetchCredits();
  }, []);

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-40"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        {creditsRemaining !== null && (
          <span className="absolute -top-1 -right-1 bg-blue-700 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {creditsRemaining}
          </span>
        )}
      </Button>

      {/* Chat panel */}
      <ChatPanel
        open={open}
        onOpenChange={setOpen}
        translations={translations}
      />
    </>
  );
}

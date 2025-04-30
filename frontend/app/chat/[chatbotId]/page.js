"use client";

import { useParams } from "next/navigation";

import ChatWindow from "@/components/chat/ChatWindow";

export default function ChatbotChatPage() {
  const params = useParams();

  const chatbotId = params?.chatbotId;

  // Wait until Next.js provides the dynamic chatbot ID.
  if (!chatbotId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-400">Loading chatbot...</p>
      </div>
    );
  }

  return <ChatWindow chatbotId={chatbotId} />;
}

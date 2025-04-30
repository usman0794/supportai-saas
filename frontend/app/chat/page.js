"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getChatbots } from "@/services/api";

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    async function openChatbot() {
      try {
        // Get the user's chatbots and open the first active one.
        const chatbots = await getChatbots();

        const activeChatbot = chatbots.find((chatbot) => chatbot.is_active);

        if (!activeChatbot) {
          router.push("/chatbots");
          return;
        }

        router.replace(`/chat/${activeChatbot.id}`);
      } catch (error) {
        console.error("Failed to load chatbots:", error);

        // If authentication expired, send the user to login.
        if (
          error.message?.toLowerCase().includes("token") ||
          error.message?.toLowerCase().includes("auth")
        ) {
          router.push("/login");
          return;
        }

        router.push("/chatbots");
      }
    }

    openChatbot();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-sm text-gray-400">Loading chatbot...</p>
    </main>
  );
}

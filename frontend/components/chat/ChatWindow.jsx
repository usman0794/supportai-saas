"use client";

import { Bot, Paperclip, Send } from "lucide-react";
import { useEffect, useState } from "react";

import {
  deleteConversation,
  getChatbot,
  getConversations,
  getMessages,
  sendChatMessage,
} from "@/services/api";

import ConversationSidebar from "@/components/chat/ConversationSidebar";

export default function ChatWindow({ chatbotId }) {
  const [chatbot, setChatbot] = useState(null);

  const [messages, setMessages] = useState([]);

  const [message, setMessage] = useState("");

  const [conversationId, setConversationId] = useState(null);

  const [conversations, setConversations] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  const [isSending, setIsSending] = useState(false);

  const [error, setError] = useState("");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /*
   * Load the first user message for each conversation.
   * This gives the sidebar a useful title without adding
   * another database column yet.
   */
  async function addConversationTitles(conversationList) {
    if (!conversationList?.length) {
      return [];
    }

    const conversationsWithTitles = await Promise.all(
      conversationList.map(async (conversation) => {
        try {
          const savedMessages = await getMessages(conversation.id);

          const firstUserMessage = savedMessages.find(
            (item) => item.role === "user",
          );

          return {
            ...conversation,
            title: firstUserMessage?.content?.trim() || "New conversation",
          };
        } catch (error) {
          console.error("Failed to load conversation title:", error);

          return {
            ...conversation,
            title: "New conversation",
          };
        }
      }),
    );

    return conversationsWithTitles;
  }

  /*
   * Load the chatbot and restore the latest conversation.
   */
  useEffect(() => {
    async function loadChat() {
      try {
        setIsLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        // Load the chatbot configuration first.
        const chatbotData = await getChatbot(chatbotId);

        setChatbot(chatbotData);

        // Load saved conversations.
        setIsLoadingConversations(true);

        const conversationData = await getConversations(chatbotId);

        // Add a useful title to every conversation.
        const conversationsWithTitles = await addConversationTitles(
          conversationData || [],
        );

        setConversations(conversationsWithTitles);

        /*
         * Restore the latest conversation after refresh.
         */
        if (conversationsWithTitles.length > 0) {
          const latestConversation = conversationsWithTitles[0];

          await loadConversation(latestConversation.id);
        } else {
          /*
           * No saved conversation exists yet,
           * so show the chatbot welcome message.
           */
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: chatbotData.welcome_message,
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to load chat:", error);

        setError(error.message || "Failed to load the chatbot.");
      } finally {
        setIsLoadingConversations(false);
        setIsLoading(false);
      }
    }

    if (chatbotId) {
      loadChat();
    }
  }, [chatbotId]);

  /*
   * Load one saved conversation and its messages.
   */
  async function loadConversation(id) {
    try {
      setError("");

      const savedMessages = await getMessages(id);

      setConversationId(id);

      setMessages(
        savedMessages.map((item) => ({
          id: item.id,
          role: item.role,
          content: item.content,
        })),
      );
    } catch (error) {
      console.error("Failed to load conversation:", error);

      setError(error.message || "Failed to load conversation.");
    }
  }

  /*
   * Start a completely new conversation.
   */
  function handleNewConversation() {
    setConversationId(null);

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: chatbot?.welcome_message || "Hi! How can I help you today?",
      },
    ]);

    setMessage("");
    setError("");

    // Close the sidebar on mobile.
    setIsSidebarOpen(false);
  }

  /*
   * Select an existing conversation.
   */
  async function handleSelectConversation(id) {
    await loadConversation(id);

    // Close the sidebar on mobile.
    setIsSidebarOpen(false);
  }

  /*
   * Delete a saved conversation.
   */
  async function handleDeleteConversation(id) {
    const confirmed = window.confirm("Delete this conversation?");

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteConversation(id);

      // Remove it from the sidebar immediately.
      setConversations((current) =>
        current.filter((conversation) => conversation.id !== id),
      );

      /*
       * If the deleted conversation is currently open,
       * start a fresh chat.
       */
      if (conversationId === id) {
        handleNewConversation();
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);

      setError(error.message || "Failed to delete conversation.");
    }
  }

  /*
   * Send a message to the AI.
   */
  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || isSending || !chatbot?.is_active) {
      return;
    }

    setError("");

    /*
     * Show the user's message immediately.
     */
    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmedMessage,
      },
    ]);

    setMessage("");
    setIsSending(true);

    try {
      const data = await sendChatMessage({
        chatbotId,
        message: trimmedMessage,
        conversationId,
      });

      /*
       * Save the conversation ID returned by FastAPI.
       */
      setConversationId(data.conversation_id);

      /*
       * Add the AI response to the current chat.
       */
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.answer,
        },
      ]);

      /*
       * Refresh the sidebar after sending.
       * This also gives a newly-created conversation
       * its first-message title.
       */
      const updatedConversations = await getConversations(chatbotId);

      const conversationsWithTitles = await addConversationTitles(
        updatedConversations || [],
      );

      setConversations(conversationsWithTitles);
    } catch (error) {
      console.error("Failed to send message:", error);

      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  /*
   * Loading screen.
   */
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-400">Loading chatbot...</p>
      </div>
    );
  }

  /*
   * Show an error if the chatbot itself could not load.
   */
  if (!chatbot) {
    return (
      <div className="flex h-screen items-center justify-center bg-white px-4">
        <p className="text-center text-sm text-red-500">
          {error || "Chatbot not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen min-h-0 bg-white">
      {/* ================================================================ */}
      {/* Desktop sidebar                                                 */}
      {/* ================================================================ */}

      <div className="hidden h-full md:block">
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={conversationId}
          isLoading={isLoadingConversations}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* ================================================================ */}
      {/* Mobile sidebar                                                   */}
      {/* ================================================================ */}

      {isSidebarOpen && (
        <>
          {/* Close the sidebar by clicking the overlay. */}
          <button
            type="button"
            aria-label="Close conversation sidebar"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
          />

          <div className="fixed inset-y-0 left-0 z-50 w-72 md:hidden">
            <ConversationSidebar
              conversations={conversations}
              activeConversationId={conversationId}
              isLoading={isLoadingConversations}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              onDeleteConversation={handleDeleteConversation}
            />
          </div>
        </>
      )}

      {/* ================================================================ */}
      {/* Main chat                                                        */}
      {/* ================================================================ */}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center border-b border-gray-100 px-3 sm:px-6">
          {/* Mobile sidebar button */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 md:hidden"
            title="Open conversations"
          >
            <MessageSquareIcon />
          </button>

          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
              <Bot className="h-4 w-4 text-gray-600" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-medium text-gray-900">
                {chatbot.name}
              </h1>

              <div className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    chatbot.is_active ? "bg-green-500" : "bg-gray-400"
                  }`}
                />

                <span className="text-xs text-gray-400">
                  {chatbot.is_active ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
            {messages.map((item) => {
              const isUser = item.role === "user";

              return (
                <div
                  key={item.id}
                  className={`flex w-full ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={
                      isUser
                        ? "max-w-[85%] whitespace-pre-line break-words rounded-2xl bg-[#EAF3FF] px-4 py-2.5 text-[15px] leading-7 text-gray-900 sm:max-w-[75%]"
                        : "max-w-[90%] whitespace-pre-line break-words px-1 text-[15px] leading-7 text-gray-800 sm:max-w-[85%]"
                    }
                  >
                    {item.content}
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex justify-start">
                <div className="px-1 text-sm text-gray-400">Thinking...</div>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-auto w-full max-w-3xl px-4 pb-2 sm:px-6">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Composer */}
        <div className="shrink-0 bg-white px-3 pb-3 pt-2 sm:px-6 sm:pb-4">
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-3xl items-end border border-gray-200 bg-white px-2 py-2 shadow-sm"
            style={{ borderRadius: "18px" }}
          >
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
              title="Attach file"
            >
              <Paperclip className="h-[18px] w-[18px]" />
            </button>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
              placeholder={`Message ${chatbot.name}...`}
              rows={1}
              disabled={isSending || !chatbot.is_active}
              className="min-h-9 max-h-32 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />

            <button
              type="submit"
              disabled={!message.trim() || isSending || !chatbot.is_active}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white transition hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <p className="mx-auto mt-2 max-w-3xl px-2 text-center text-[11px] text-gray-400">
            SupportAI can make mistakes. Check important information.
          </p>
        </div>
      </div>
    </div>
  );
}

/*
 * Small mobile sidebar icon.
 * Keeping it here avoids adding another dependency.
 */
function MessageSquareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

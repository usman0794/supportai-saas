"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MessageCircle,
  Bot,
  Trash2,
  Loader2,
  Search,
  ChevronRight,
  User,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ConversationsPage() {
  const [chatbots, setChatbots] = useState([]);
  const [selectedChatbotId, setSelectedChatbotId] = useState("");

  const [conversations, setConversations] = useState([]);

  const [conversationPreviews, setConversationPreviews] = useState({});

  const [selectedConversation, setSelectedConversation] = useState(null);

  const [messages, setMessages] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");

  const [isLoadingChatbots, setIsLoadingChatbots] = useState(true);

  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");

  // ==========================================
  // Load Chatbots
  // ==========================================

  useEffect(() => {
    loadChatbots();
  }, []);

  async function loadChatbots() {
    try {
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/chatbots`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load chatbots.");
      }

      setChatbots(data);

      if (data.length > 0) {
        setSelectedChatbotId(data[0].id);
      }
    } catch (error) {
      setError(error.message || "Failed to load chatbots.");
    } finally {
      setIsLoadingChatbots(false);
    }
  }

  // ==========================================
  // Load Conversations
  // ==========================================

  useEffect(() => {
    if (!selectedChatbotId) {
      return;
    }

    loadConversations(selectedChatbotId);
  }, [selectedChatbotId]);

  async function loadConversations(chatbotId) {
    try {
      setError("");
      setIsLoadingConversations(true);

      setSelectedConversation(null);
      setMessages([]);
      setConversationPreviews({});

      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/v1/conversations?chatbot_id=${encodeURIComponent(
          chatbotId,
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load conversations.");
      }

      setConversations(data);

      if (data.length > 0) {
        /*
         * Load the first user message for each
         * conversation so the list can show
         * a useful preview/title.
         */
        await loadConversationPreviews(data, token);

        selectConversation(data[0]);
      }
    } catch (error) {
      setError(error.message || "Failed to load conversations.");
    } finally {
      setIsLoadingConversations(false);
    }
  }

  // ==========================================
  // Load Conversation Previews
  // ==========================================

  async function loadConversationPreviews(conversationList, token) {
    const previewEntries = await Promise.all(
      conversationList.map(async (conversation) => {
        try {
          const response = await fetch(
            `${API_URL}/api/v1/conversations/${conversation.id}/messages`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!response.ok) {
            return [conversation.id, ""];
          }

          const data = await response.json();

          const firstUserMessage = data.find(
            (message) => message.role === "user",
          );

          return [
            conversation.id,
            firstUserMessage ? firstUserMessage.content : "New conversation",
          ];
        } catch {
          return [conversation.id, "New conversation"];
        }
      }),
    );

    setConversationPreviews(Object.fromEntries(previewEntries));
  }

  // ==========================================
  // Load Messages
  // ==========================================

  async function selectConversation(conversation) {
    setSelectedConversation(conversation);

    setMessages([]);

    try {
      setError("");
      setIsLoadingMessages(true);

      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/v1/conversations/${conversation.id}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load messages.");
      }

      setMessages(data);
    } catch (error) {
      setError(error.message || "Failed to load messages.");
    } finally {
      setIsLoadingMessages(false);
    }
  }

  // ==========================================
  // Delete Conversation
  // ==========================================

  async function handleDelete(conversationId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this conversation?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setDeletingId(conversationId);

      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/v1/conversations/${conversationId}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to delete conversation.");
      }

      const remaining = conversations.filter(
        (conversation) => conversation.id !== conversationId,
      );

      setConversations(remaining);

      setConversationPreviews((current) => {
        const updated = {
          ...current,
        };

        delete updated[conversationId];

        return updated;
      });

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);

        if (remaining.length > 0) {
          selectConversation(remaining[0]);
        }
      }
    } catch (error) {
      setError(error.message || "Failed to delete conversation.");
    } finally {
      setDeletingId(null);
    }
  }

  // ==========================================
  // Filter Conversations
  // ==========================================

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const preview = conversationPreviews[conversation.id] || "";

      return (
        preview.toLowerCase().includes(query) ||
        conversation.id.toLowerCase().includes(query)
      );
    });
  }, [conversations, conversationPreviews, searchQuery]);

  // ==========================================
  // Format Date
  // ==========================================

  function formatDate(dateString) {
    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);

    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // ==========================================
  // Format Message
  // ==========================================

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatMessage(content) {
    let formatted = escapeHtml(content);

    // Convert **text** to bold.
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Preserve line breaks.
    formatted = formatted.replace(/\n/g, "<br />");

    return formatted;
  }

  // ==========================================
  // Loading
  // ==========================================

  if (isLoadingChatbots) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading conversations...
        </div>
      </div>
    );
  }

  // ==========================================
  // No Chatbots
  // ==========================================

  if (chatbots.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-[500px] max-w-5xl flex-col items-center justify-center px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
            <Bot className="h-6 w-6 text-gray-400" />
          </div>

          <h1 className="mt-4 text-lg font-semibold text-gray-900">
            No chatbots yet
          </h1>

          <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
            Create a chatbot first to start managing customer conversations.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // Main UI
  // ==========================================

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-5">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            Conversations
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View and manage customer conversations with your AI chatbots.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8">
        {/* Error */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Chatbot selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="chatbot" className="text-sm text-gray-500">
              Chatbot
            </label>

            <select
              id="chatbot"
              value={selectedChatbotId}
              onChange={(event) => setSelectedChatbotId(event.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-gray-400"
            >
              {chatbots.map((chatbot) => (
                <option key={chatbot.id} value={chatbot.id}>
                  {chatbot.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search conversations..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-gray-400"
            />
          </div>
        </div>

        {/* Main conversation panel */}
        <div className="grid min-h-[600px] grid-cols-1 overflow-hidden rounded-xl border border-gray-200 bg-white lg:grid-cols-[320px_1fr]">
          {/* Conversation List */}
          <aside className="border-b border-gray-200 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
              <div>
                <h2 className="text-sm font-medium text-gray-900">
                  Conversations
                </h2>

                <p className="mt-0.5 text-xs text-gray-400">
                  {filteredConversations.length} conversation
                  {filteredConversations.length !== 1 ? "s" : ""}
                </p>
              </div>

              <MessageCircle className="h-4 w-4 text-gray-400" />
            </div>

            {/* Loading */}
            {isLoadingConversations ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <MessageCircle className="mx-auto h-6 w-6 text-gray-300" />

                <p className="mt-3 text-sm font-medium text-gray-700">
                  No conversations
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-400">
                  Customer conversations will appear here.
                </p>
              </div>
            ) : (
              <div className="max-h-[540px] overflow-y-auto">
                {filteredConversations.map((conversation, index) => {
                  const isSelected =
                    selectedConversation?.id === conversation.id;

                  const preview =
                    conversationPreviews[conversation.id] || "New conversation";

                  return (
                    <button
                      type="button"
                      key={conversation.id}
                      onClick={() => selectConversation(conversation)}
                      className={`w-full border-b border-gray-100 px-4 py-4 text-left transition ${
                        isSelected ? "bg-gray-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {preview}
                            </p>

                            <ChevronRight
                              className={`h-4 w-4 shrink-0 ${
                                isSelected ? "text-gray-700" : "text-gray-300"
                              }`}
                            />
                          </div>

                          <p className="mt-1 text-xs text-gray-400">
                            {formatDate(conversation.updated_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          {/* Conversation Details */}
          <section className="flex min-h-[600px] flex-col">
            {!selectedConversation ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                  <MessageCircle className="h-5 w-5 text-gray-400" />
                </div>

                <h2 className="mt-4 text-sm font-medium text-gray-900">
                  Select a conversation
                </h2>

                <p className="mt-1 max-w-sm text-xs leading-5 text-gray-400">
                  Select a conversation from the list to view its messages.
                </p>
              </div>
            ) : (
              <>
                {/* Conversation Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-gray-900">
                      {conversationPreviews[selectedConversation.id] ||
                        "Conversation"}
                    </h2>

                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      {formatDate(selectedConversation.updated_at)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(selectedConversation.id)}
                    disabled={deletingId === selectedConversation.id}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Delete conversation"
                    aria-label="Delete conversation"
                  >
                    {deletingId === selectedConversation.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 px-5 py-6">
                  {isLoadingMessages ? (
                    <div className="flex h-full min-h-[300px] items-center justify-center">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading messages...
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full min-h-[300px] items-center justify-center text-sm text-gray-400">
                      No messages in this conversation.
                    </div>
                  ) : (
                    <div className="mx-auto max-w-2xl space-y-5">
                      {messages.map((message) => {
                        const isUser = message.role === "user";

                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isUser ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] ${
                                isUser ? "items-end" : "items-start"
                              }`}
                            >
                              <div
                                className={`mb-1 text-[11px] font-medium ${
                                  isUser
                                    ? "text-right text-gray-400"
                                    : "text-left text-gray-500"
                                }`}
                              >
                                {isUser ? "Customer" : "SupportAI"}
                              </div>

                              <div
                                className={`rounded-xl px-4 py-3 text-sm leading-6 ${
                                  isUser
                                    ? "rounded-br-sm bg-gray-900 text-white"
                                    : "rounded-bl-sm border border-gray-200 bg-white text-gray-700"
                                }`}
                                dangerouslySetInnerHTML={{
                                  __html: formatMessage(message.content),
                                }}
                              />

                              <div
                                className={`mt-1 text-[10px] text-gray-400 ${
                                  isUser ? "text-right" : "text-left"
                                }`}
                              >
                                {formatDate(message.created_at)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

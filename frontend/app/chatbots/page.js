"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  MessageCircle,
  BookOpen,
  Settings,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ChatbotsPage() {
  const [chatbots, setChatbots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadChatbots();
  }, []);

  async function loadChatbots() {
    try {
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
    } catch (error) {
      setError(error.message || "Failed to load chatbots.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(chatbotId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this chatbot?",
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(chatbotId);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/chatbots/${chatbotId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to delete chatbot.");
      }

      // Remove the deleted chatbot without refreshing the page.
      setChatbots((current) =>
        current.filter((chatbot) => chatbot.id !== chatbotId),
      );
    } catch (error) {
      setError(error.message || "Failed to delete chatbot.");
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading chatbots...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-6 sm:px-5 sm:py-7">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">
              Chatbots
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Create and manage your AI customer support chatbots.
            </p>
          </div>

          <Link
            href="/chatbots/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gray-900 px-3.5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 sm:px-4"
          >
            <Plus className="h-4 w-4" />

            <span className="hidden sm:inline">New chatbot</span>

            <span className="sm:hidden">New</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-5 sm:py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Empty state */}
        {chatbots.length === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <Bot className="h-5 w-5 text-gray-500" />
            </div>

            <h2 className="mt-4 text-base font-medium text-gray-900">
              No chatbots yet
            </h2>

            <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">
              Create your first chatbot and connect it to your knowledge base.
            </p>

            <Link
              href="/chatbots/new"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              Create chatbot
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {chatbots.map((chatbot) => (
              <article
                key={chatbot.id}
                className="flex min-w-0 flex-col rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 sm:p-5"
              >
                {/* Chatbot header */}
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50">
                    <Bot className="h-5 w-5 text-gray-500" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-medium text-gray-900">
                      {chatbot.name}
                    </h2>

                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          chatbot.is_active ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />

                      <span className="text-xs text-gray-400">
                        {chatbot.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-5 min-h-[48px] text-sm leading-6 text-gray-500">
                  {chatbot.description || "AI customer support chatbot."}
                </p>

                {/* Actions */}
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                    {/* Main actions */}
                    <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 sm:flex sm:flex-wrap">
                      <Link
                        href={`/chat/${chatbot.id}`}
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                      >
                        <MessageCircle className="h-4 w-4 shrink-0" />
                        <span>Open chat</span>
                      </Link>

                      <Link
                        href={`/knowledge-base/${chatbot.id}`}
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                      >
                        <BookOpen className="h-4 w-4 shrink-0" />
                        <span>Knowledge Base</span>
                      </Link>

                      <Link
                        href={`/chatbots/${chatbot.id}`}
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                      >
                        <Settings className="h-4 w-4 shrink-0" />
                        <span>Settings</span>
                      </Link>
                    </div>

                    {/* Delete */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDelete(chatbot.id)}
                        disabled={deletingId === chatbot.id}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Delete chatbot"
                        aria-label={`Delete ${chatbot.name}`}
                      >
                        {deletingId === chatbot.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

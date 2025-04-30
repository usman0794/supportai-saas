"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Bot, Loader2, Save } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function NewChatbotPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful customer support assistant. Answer questions accurately and professionally.",
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Hi! How can I help you today?",
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      // Create the chatbot using the authenticated FastAPI endpoint.
      const response = await fetch(`${API_URL}/api/v1/chatbots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description: description || null,
          system_prompt: systemPrompt,
          welcome_message: welcomeMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create chatbot");
      }

      // Return to the chatbot list after successful creation.
      window.location.href = "/chatbots";
    } catch (error) {
      setError(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
          <Link
            href="/chatbots"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to chatbots
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Bot className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Create chatbot
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Configure your AI customer support chatbot.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic information */}
          <section className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              Basic information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Give your chatbot a name and description.
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Chatbot name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. SupportAI Customer Support"
                  required
                  maxLength={100}
                  className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe what this chatbot is used for..."
                  maxLength={1000}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </section>

          {/* AI behavior */}
          <section className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              AI behavior
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Tell your chatbot how it should respond.
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  System prompt
                </label>

                <textarea
                  value={systemPrompt}
                  onChange={(event) => setSystemPrompt(event.target.value)}
                  rows={6}
                  required
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-gray-400">
                  This controls the chatbot's general behavior.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Welcome message
                </label>

                <textarea
                  value={welcomeMessage}
                  onChange={(event) => setWelcomeMessage(event.target.value)}
                  rows={3}
                  required
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-gray-400">
                  This message appears when a customer starts a chat.
                </p>
              </div>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/chatbots"
              className="rounded-lg border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {loading ? "Creating..." : "Create chatbot"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

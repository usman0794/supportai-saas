"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  FileText,
  MessageSquare,
  MessageCircle,
  Plus,
  Database,
} from "lucide-react";

import Link from "next/link";

import { getChatbots, getDocuments, getConversations } from "@/services/api";

export default function Dashboard() {
  const [chatbots, setChatbots] = useState([]);
  const [documentCount, setDocumentCount] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const bots = await getChatbots();

      setChatbots(bots);

      let documents = 0;
      let conversations = 0;

      for (const bot of bots) {
        try {
          const botDocuments = await getDocuments(bot.id);
          documents += botDocuments.length;
        } catch {
          // Ignore document errors so the dashboard can still load.
        }

        try {
          const botConversations = await getConversations(bot.id);
          conversations += botConversations.length;
        } catch {
          // Ignore conversation errors so the dashboard can still load.
        }
      }

      setDocumentCount(documents);
      setConversationCount(conversations);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const activeChatbots = chatbots.filter((chatbot) => chatbot.is_active).length;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>

            <p className="mt-2 text-muted-foreground">
              Manage your AI customer support chatbots.
            </p>
          </div>

          <Link
            href="/chatbots"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            Create chatbot
          </Link>
        </div>

        {/* Statistics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Chatbots"
            value={loading ? "..." : chatbots.length}
            icon={Bot}
          />

          <StatCard
            title="Active chatbots"
            value={loading ? "..." : activeChatbots}
            icon={Database}
          />

          <StatCard
            title="Documents"
            value={loading ? "..." : documentCount}
            icon={FileText}
          />

          <StatCard
            title="Conversations"
            value={loading ? "..." : conversationCount}
            icon={MessageSquare}
          />
        </div>

        {/* Chatbots */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Your chatbots</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage and test your AI support assistants.
              </p>
            </div>

            <Link
              href="/chatbots"
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Manage
            </Link>
          </div>

          {loading ? (
            <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
              Loading chatbots...
            </div>
          ) : chatbots.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <Bot className="mx-auto h-10 w-10 text-muted-foreground" />

              <h3 className="mt-4 font-semibold">No chatbots yet</h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Create your first AI customer support chatbot.
              </p>

              <Link
                href="/chatbots"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                Create chatbot
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {chatbots.map((chatbot) => (
                <ChatbotCard key={chatbot.id} chatbot={chatbot} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>

          <p className="mt-2 text-3xl font-semibold">{value}</p>
        </div>

        <div className="rounded-lg bg-muted p-3">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ChatbotCard({ chatbot }) {
  return (
    <div className="rounded-xl border bg-card p-5 transition hover:shadow-sm">
      {/* Chatbot information */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-lg bg-muted p-2.5">
            <Bot className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-semibold">{chatbot.name}</h3>

            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  chatbot.is_active ? "bg-green-500" : "bg-muted-foreground"
                }`}
              />

              <span className="text-muted-foreground">
                {chatbot.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="mt-4 line-clamp-2 min-h-10 text-sm text-muted-foreground">
        {chatbot.description || "AI customer support chatbot"}
      </p>

      {/* Actions */}
      <div className="mt-5 flex gap-2">
        {/* Open chat */}
        <Link
          href={`/chat/${chatbot.id}`}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
          Open chat
        </Link>

        {/* Knowledge Base */}
        <Link
          href={`/knowledge-base/${chatbot.id}`}
          className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted"
          title="Knowledge Base"
        >
          <FileText className="h-4 w-4" strokeWidth={1.8} />
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ChatbotSettingsPage() {
  const params = useParams();
  const router = useRouter();

  const chatbotId = params.chatbotId;

  const [form, setForm] = useState({
    name: "",
    description: "",
    system_prompt: "",
    welcome_message: "",
    is_active: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load the selected chatbot before showing the edit form.
  useEffect(() => {
    async function loadChatbot() {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/api/v1/chatbots/${chatbotId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load chatbot.");
        }

        setForm({
          name: data.name || "",
          description: data.description || "",
          system_prompt: data.system_prompt || "",
          welcome_message: data.welcome_message || "",
          is_active: data.is_active,
        });
      } catch (error) {
        setError(error.message || "Failed to load chatbot.");
      } finally {
        setIsLoading(false);
      }
    }

    if (chatbotId) {
      loadChatbot();
    }
  }, [chatbotId, router]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(`${API_URL}/api/v1/chatbots/${chatbotId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update chatbot.");
      }

      // Keep the form synchronized with the saved backend data.
      setForm({
        name: data.name || "",
        description: data.description || "",
        system_prompt: data.system_prompt || "",
        welcome_message: data.welcome_message || "",
        is_active: data.is_active,
      });

      setSuccess("Chatbot settings saved.");
    } catch (error) {
      setError(error.message || "Failed to save chatbot.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-400">Loading chatbot...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="border-b border-gray-100">
        <div className="mx-auto max-w-3xl px-5 py-7">
          <Link
            href="/chatbots"
            className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to chatbots
          </Link>

          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            Chatbot settings
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Configure how your chatbot looks and responds.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic information */}
          <section className="rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-medium text-gray-900">
              Basic information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Give your chatbot a name and description.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm text-gray-700">
                  Chatbot name
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  maxLength={1000}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
            </div>
          </section>

          {/* AI behavior */}
          <section className="rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-medium text-gray-900">AI behavior</h2>

            <p className="mt-1 text-sm text-gray-500">
              Tell your chatbot how it should respond.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm text-gray-700">
                  System prompt
                </label>

                <textarea
                  name="system_prompt"
                  value={form.system_prompt}
                  onChange={handleChange}
                  rows={6}
                  className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm leading-6 text-gray-900 outline-none focus:border-gray-400"
                />

                <p className="mt-1.5 text-xs text-gray-400">
                  This controls the chatbot's general behavior.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-700">
                  Welcome message
                </label>

                <textarea
                  name="welcome_message"
                  value={form.welcome_message}
                  onChange={handleChange}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
            </div>
          </section>

          {/* Status */}
          <section className="rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-medium text-gray-900">
                  Chatbot status
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Turn the chatbot on or off.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    is_active: !current.is_active,
                  }))
                }
                className={`relative h-6 w-11 rounded-full transition ${
                  form.is_active ? "bg-gray-900" : "bg-gray-200"
                }`}
                aria-label="Toggle chatbot status"
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                    form.is_active ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-400">
              {form.is_active
                ? "This chatbot is currently available."
                : "This chatbot is currently disabled."}
            </p>
          </section>

          {/* Feedback */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {success && <p className="text-sm text-green-600">{success}</p>}

          {/* Save */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

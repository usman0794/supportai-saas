"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Trash2,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function KnowledgeBasePage() {
  const params = useParams();
  const chatbotId = params.chatbotId;

  const fileInputRef = useRef(null);

  const [chatbot, setChatbot] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load the chatbot and its documents together.
  useEffect(() => {
    async function loadData() {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [chatbotResponse, documentsResponse] = await Promise.all([
          fetch(`${API_URL}/api/v1/chatbots/${chatbotId}`, { headers }),
          fetch(`${API_URL}/api/v1/documents/${chatbotId}`, { headers }),
        ]);

        const chatbotData = await chatbotResponse.json();
        const documentsData = await documentsResponse.json();

        if (!chatbotResponse.ok) {
          throw new Error(chatbotData.detail || "Failed to load chatbot.");
        }

        if (!documentsResponse.ok) {
          throw new Error(documentsData.detail || "Failed to load documents.");
        }

        setChatbot(chatbotData);
        setDocuments(documentsData);
      } catch (error) {
        setError(error.message || "Failed to load knowledge base.");
      } finally {
        setIsLoading(false);
      }
    }

    if (chatbotId) {
      loadData();
    }
  }, [chatbotId]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setMessage("");
    setIsUploading(true);

    try {
      const token = localStorage.getItem("access_token");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/api/v1/documents/upload/${chatbotId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed.");
      }

      // Add the new document immediately to the list.
      setDocuments((current) => [data, ...current]);

      setMessage(`${data.filename} uploaded successfully.`);
    } catch (error) {
      setError(error.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);

      // Reset the input so the same file can be selected again.
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDelete(documentId) {
    const confirmed = window.confirm("Delete this document?");

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_URL}/api/v1/documents/${documentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to delete document.");
      }

      // Remove the document from the UI after deletion.
      setDocuments((current) =>
        current.filter((document) => document.id !== documentId),
      );
    } catch (error) {
      setError(error.message || "Failed to delete document.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-400">Loading knowledge base...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="mx-auto max-w-4xl px-5 py-7">
          <Link
            href="/chatbots"
            className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to chatbots
          </Link>

          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            Knowledge Base
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Upload documents that your chatbot can use to answer questions.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-5 py-8">
        {/* Chatbot information */}
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Chatbot
          </p>

          <div className="mt-2 flex items-center justify-between">
            <h2 className="text-base font-medium text-gray-900">
              {chatbot?.name}
            </h2>

            <Link
              href={`/chatbots/${chatbotId}`}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Settings
            </Link>
          </div>
        </div>

        {/* Upload area */}
        <section className="rounded-xl border border-gray-200 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-medium text-gray-900">
                Add knowledge
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Upload PDF, TXT, or Markdown files for{" "}
                <span className="text-gray-700">{chatbot?.name}</span>.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Upload className="h-4 w-4" />

              {isUploading ? "Uploading..." : "Upload document"}
            </button>
          </div>
        </section>

        {/* Success message */}
        {message && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </div>
        )}

        {/* Error message */}
        {error && <div className="mt-4 text-sm text-red-500">{error}</div>}

        {/* Documents */}
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">Documents</h2>

            <span className="text-xs text-gray-400">
              {documents.length}{" "}
              {documents.length === 1 ? "document" : "documents"}
            </span>
          </div>

          {documents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-14 text-center">
              <FileText className="mx-auto h-7 w-7 text-gray-300" />

              <p className="mt-3 text-sm text-gray-500">
                No documents uploaded yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center gap-4 px-4 py-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                    <FileText className="h-4 w-4 text-gray-500" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {document.filename}
                    </p>

                    <p className="mt-0.5 text-xs uppercase text-gray-400">
                      {document.file_type}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          document.status === "processed"
                            ? "bg-green-500"
                            : document.status === "failed"
                              ? "bg-red-500"
                              : "bg-yellow-400"
                        }`}
                      />

                      <span className="text-xs text-gray-500">
                        {document.status}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(document.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-red-500"
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

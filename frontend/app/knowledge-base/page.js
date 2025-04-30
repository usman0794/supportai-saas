"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Upload,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function KnowledgeBasePage() {
  const [chatbots, setChatbots] = useState([]);
  const [selectedChatbot, setSelectedChatbot] = useState("");
  const [documents, setDocuments] = useState([]);

  const [isLoadingChatbots, setIsLoadingChatbots] = useState(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef(null);

  // Load the user's chatbots so documents can belong to a specific bot.
  useEffect(() => {
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

        if (data.length > 0) {
          setSelectedChatbot(data[0].id);
        }
      } catch (error) {
        setError(error.message || "Failed to load chatbots.");
      } finally {
        setIsLoadingChatbots(false);
      }
    }

    loadChatbots();
  }, []);

  // Load documents whenever the selected chatbot changes.
  useEffect(() => {
    if (!selectedChatbot) {
      setDocuments([]);
      return;
    }

    async function loadDocuments() {
      try {
        setIsLoadingDocuments(true);
        setError("");

        const token = localStorage.getItem("access_token");

        const response = await fetch(
          `${API_URL}/api/v1/documents/${selectedChatbot}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load documents.");
        }

        setDocuments(data);
      } catch (error) {
        setError(error.message || "Failed to load documents.");
      } finally {
        setIsLoadingDocuments(false);
      }
    }

    loadDocuments();
  }, [selectedChatbot]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file || !selectedChatbot) {
      return;
    }

    setError("");
    setSuccess("");
    setIsUploading(true);

    try {
      const token = localStorage.getItem("access_token");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/api/v1/documents/upload/${selectedChatbot}`,
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

      // Add the new document to the list immediately.
      setDocuments((current) => [data, ...current]);

      setSuccess(`${file.name} uploaded successfully.`);

      // Allow the same file to be selected again later.
      event.target.value = "";
    } catch (error) {
      setError(error.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(documentId) {
    const confirmed = window.confirm("Delete this document?");

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

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

      // Remove the document from the screen after deletion.
      setDocuments((current) =>
        current.filter((document) => document.id !== documentId),
      );

      setSuccess("Document deleted successfully.");
    } catch (error) {
      setError(error.message || "Failed to delete document.");
    }
  }

  const currentChatbot = chatbots.find(
    (chatbot) => chatbot.id === selectedChatbot,
  );

  if (isLoadingChatbots) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-400">Loading knowledge base...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="border-b border-gray-100">
        <div className="mx-auto max-w-5xl px-5 py-8">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            Knowledge Base
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Upload documents that your chatbot can use to answer questions.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {/* Chatbot selector */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-800">
            Chatbot
          </label>

          <select
            value={selectedChatbot}
            onChange={(event) => setSelectedChatbot(event.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400"
          >
            {chatbots.map((chatbot) => (
              <option key={chatbot.id} value={chatbot.id}>
                {chatbot.name}
              </option>
            ))}
          </select>
        </div>

        {chatbots.length === 0 ? (
          <div className="rounded-xl border border-gray-200 p-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-gray-300" />

            <h2 className="mt-3 text-sm font-medium text-gray-900">
              No chatbots yet
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Create a chatbot before adding documents.
            </p>
          </div>
        ) : (
          <>
            {/* Upload area */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-6">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-sm font-medium text-gray-900">
                    Add knowledge
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Upload PDF, TXT, or Markdown files for{" "}
                    <span className="font-medium text-gray-700">
                      {currentChatbot?.name}
                    </span>
                    .
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}

                  {isUploading ? "Uploading..." : "Upload document"}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf"
                  onChange={handleUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Messages */}
            {success && (
              <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Documents */}
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-900">Documents</h2>

                <span className="text-xs text-gray-400">
                  {documents.length}{" "}
                  {documents.length === 1 ? "document" : "documents"}
                </span>
              </div>

              {isLoadingDocuments ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  Loading documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
                  <FileText className="mx-auto h-8 w-8 text-gray-300" />

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
                        <p className="truncate text-sm font-medium text-gray-800">
                          {document.filename}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-400">
                          {document.file_type.toUpperCase()}
                        </p>
                      </div>

                      <div className="hidden items-center gap-1.5 sm:flex">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            document.status === "processed"
                              ? "bg-green-500"
                              : document.status === "failed"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                          }`}
                        />

                        <span className="text-xs text-gray-500">
                          {document.status}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(document.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-50 hover:text-red-500"
                        title="Delete document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

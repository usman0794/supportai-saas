"use client";

import { useEffect, useState } from "react";
import { LogOut, Save, Loader2, User } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function SettingsPage() {
  const [user, setUser] = useState({
    id: "",
    email: "",
    full_name: "",
    avatar_url: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const response = await fetch(`${API_URL}/api/v1/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load profile.");
        }

        setUser({
          id: data.id || "",
          email: data.email || "",
          full_name: data.full_name || "",
          avatar_url: data.avatar_url || "",
        });
      } catch (error) {
        setError(error.message || "Failed to load profile.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setUser((current) => ({
      ...current,
      [name]: value,
    }));

    // Clear old messages when the user starts editing again.
    setError("");
    setSuccess("");
  }

  async function handleSave(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/auth/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: user.full_name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update profile.");
      }

      // Keep the screen synchronized with the saved backend data.
      setUser((current) => ({
        ...current,
        id: data.id || current.id,
        email: data.email || current.email,
        full_name: data.full_name || "",
        avatar_url: data.avatar_url || "",
      }));

      setSuccess("Profile updated successfully.");
    } catch (error) {
      setError(error.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleLogout() {
    // Removing the JWT ends the current frontend session.
    localStorage.removeItem("access_token");

    window.location.href = "/login";
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="border-b border-gray-100">
        <div className="mx-auto max-w-3xl px-5 py-7">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            Settings
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your account and profile.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile information */}
          <section className="rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50">
                <User className="h-4 w-4 text-gray-500" />
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-900">Profile</h2>

                <p className="mt-0.5 text-sm text-gray-500">
                  Your account information.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {/* Full name */}
              <div>
                <label
                  htmlFor="full_name"
                  className="mb-2 block text-sm text-gray-700"
                >
                  Full name
                </label>

                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={user.full_name}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm text-gray-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 outline-none"
                />

                <p className="mt-1.5 text-xs text-gray-400">
                  Email changes are not available yet.
                </p>
              </div>
            </div>
          </section>

          {/* Account */}
          <section className="rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-medium text-gray-900">Account</h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage your current session.
            </p>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </section>

          {/* Success and error messages */}
          {error && <div className="text-sm text-red-500">{error}</div>}

          {success && <div className="text-sm text-green-600">{success}</div>}

          {/* Save button */}
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

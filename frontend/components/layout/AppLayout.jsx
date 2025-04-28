"use client";

import { useEffect, useState } from "react";

import Header from "./Header";
import Sidebar from "./Sidebar";
import { getCurrentUser } from "@/services/api";

export default function AppLayout({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  async function checkAuthentication() {
    // There is no browser storage during server rendering.
    if (typeof window === "undefined") {
      return;
    }

    const token = localStorage.getItem("access_token");

    // No JWT means the user must log in first.
    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      // Ask FastAPI to verify the JWT.
      await getCurrentUser();

      setAuthenticated(true);
    } catch (error) {
      // apiRequest() handles invalid/expired tokens.
      console.error("Authentication check failed:", error);
    } finally {
      setCheckingAuth(false);
    }
  }

  // Don't render private application content while authentication
  // is still being checked.
  if (checkingAuth || !authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Checking your session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <Sidebar
          mobileMenuOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header onMenuClick={() => setMobileMenuOpen(true)} />

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Menu } from "lucide-react";

export default function Header({ onMenuClick }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-6">
      {/* Mobile menu */}
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 md:hidden"
        title="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Keep the desktop header clean */}
      <div className="hidden md:block" />
    </header>
  );
}

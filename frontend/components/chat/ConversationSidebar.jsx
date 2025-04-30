"use client";

import { MessageSquare, Plus, Trash2 } from "lucide-react";

export default function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-gray-100 bg-white">
      {/* Header keeps the sidebar controls easy to access. */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 px-4">
        <h2 className="text-sm font-semibold text-gray-900">Conversations</h2>

        <button
          type="button"
          onClick={onNewConversation}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-gray-900 px-3 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          <span>New chat</span>
        </button>
      </div>

      {/* Conversation list. */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <MessageSquare className="mx-auto mb-2 h-5 w-5 text-gray-300" />

            <p className="text-sm text-gray-400">No conversations yet.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;

              // Show the generated title, or a simple fallback.
              const title = conversation.title || "New conversation";

              return (
                <div
                  key={conversation.id}
                  className={`group flex items-center gap-1 rounded-lg ${
                    isActive ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conversation.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left"
                  >
                    <MessageSquare
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? "text-gray-700" : "text-gray-400"
                      }`}
                    />

                    <span
                      className={`truncate text-sm ${
                        isActive ? "font-medium text-gray-900" : "text-gray-600"
                      }`}
                    >
                      {title}
                    </span>
                  </button>

                  {/* Delete appears when the conversation is hovered. */}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();

                      onDeleteConversation(conversation.id);
                    }}
                    className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    title="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

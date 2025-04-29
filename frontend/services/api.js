const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Get the saved JWT token used by protected backend routes.
function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("access_token");
}

// Remove the current JWT and return the user to the login page.
export function logoutUser() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("access_token");

  // Avoid reloading the login page if the user is already there.
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

// Handle an expired or invalid JWT consistently across the application.
function handleUnauthorized() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("access_token");

  // Don't redirect repeatedly if we are already on an auth page.
  const authPages = ["/login", "/register"];

  if (!authPages.includes(window.location.pathname)) {
    window.location.href = "/login";
  }
}

// Common request helper keeps authentication and error handling consistent.
async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,

    headers: {
      ...(options.headers || {}),

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
  });

  // Some DELETE/empty responses may not contain JSON.
  const data = await response.json().catch(() => null);

  // The JWT is missing, expired, or invalid.
  if (response.status === 401) {
    handleUnauthorized();

    throw new Error(
      data?.detail ||
        data?.message ||
        "Your session has expired. Please log in again.",
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        "Something went wrong. Please try again.",
    );
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/* Authentication                                                              */
/* -------------------------------------------------------------------------- */

export async function registerUser(data) {
  return apiRequest("/api/v1/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function loginUser(data) {
  return apiRequest("/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function getCurrentUser() {
  // The backend identifies the current user from the JWT.
  return apiRequest("/api/v1/auth/me");
}

/* -------------------------------------------------------------------------- */
/* Chatbots                                                                    */
/* -------------------------------------------------------------------------- */

export async function getChatbots() {
  return apiRequest("/api/v1/chatbots");
}

export async function getChatbot(chatbotId) {
  return apiRequest(`/api/v1/chatbots/${chatbotId}`);
}

export async function createChatbot(data) {
  return apiRequest("/api/v1/chatbots", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function updateChatbot(chatbotId, data) {
  return apiRequest(`/api/v1/chatbots/${chatbotId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function deleteChatbot(chatbotId) {
  return apiRequest(`/api/v1/chatbots/${chatbotId}`, {
    method: "DELETE",
  });
}

/* -------------------------------------------------------------------------- */
/* Conversations                                                               */
/* -------------------------------------------------------------------------- */

export async function getConversations(chatbotId) {
  // The backend returns the user's conversations for this chatbot.
  return apiRequest(
    `/api/v1/conversations?chatbot_id=${encodeURIComponent(chatbotId)}`,
  );
}

export async function getConversation(conversationId) {
  return apiRequest(`/api/v1/conversations/${conversationId}`);
}

export async function deleteConversation(conversationId) {
  return apiRequest(`/api/v1/conversations/${conversationId}`, {
    method: "DELETE",
  });
}

/* -------------------------------------------------------------------------- */
/* Messages                                                                    */
/* -------------------------------------------------------------------------- */

export async function getMessages(conversationId) {
  // Load saved messages when restoring a previous conversation.
  return apiRequest(`/api/v1/conversations/${conversationId}/messages`);
}

/* -------------------------------------------------------------------------- */
/* Chat / RAG                                                                  */
/* -------------------------------------------------------------------------- */

export async function sendChatMessage({
  chatbotId,
  message,
  conversationId = null,
}) {
  // The backend identifies the chatbot from the URL.
  return apiRequest(`/api/v1/chat/${chatbotId}`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      message,
      conversation_id: conversationId,
    }),
  });
}

/* -------------------------------------------------------------------------- */
/* Documents / Knowledge Base                                                  */
/* -------------------------------------------------------------------------- */

export async function getDocuments(chatbotId) {
  return apiRequest(`/api/v1/documents/${chatbotId}`);
}

export async function deleteDocument(documentId) {
  return apiRequest(`/api/v1/documents/${documentId}`, {
    method: "DELETE",
  });
}

export async function uploadDocument(chatbotId, file) {
  const token = getToken();

  // FormData lets the browser upload the actual file.
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/api/v1/documents/upload/${chatbotId}`,
    {
      method: "POST",

      headers: {
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },

      // Do not manually set Content-Type here.
      // The browser adds the multipart boundary automatically.
      body: formData,
    },
  );

  const data = await response.json().catch(() => null);

  // Handle expired/invalid JWT for file uploads too.
  if (response.status === 401) {
    handleUnauthorized();

    throw new Error(
      data?.detail ||
        data?.message ||
        "Your session has expired. Please log in again.",
    );
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || "Document upload failed.");
  }

  return data;
}

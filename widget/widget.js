(function () {
  "use strict";

  const script =
    document.currentScript || document.querySelector("script[data-chatbot-id]");

  if (!script) {
    console.error("SupportAI: widget script was not found.");
    return;
  }

  const chatbotId = script.getAttribute("data-chatbot-id");

  if (!chatbotId) {
    console.error("SupportAI: data-chatbot-id is required.");
    return;
  }

  const apiUrl = script.getAttribute("data-api-url") || "http://127.0.0.1:8000";

  const conversationKey = `supportai_conversation_${chatbotId}`;

  const messagesKey = `supportai_messages_${chatbotId}`;

  let conversationId = localStorage.getItem(conversationKey) || null;

  let isOpen = false;
  let isLoading = false;

  // Prevent infinite retry loops when recovering
  // from an invalid conversation.
  let isRecoveringConversation = false;

  // Default values used if the config API fails.
  let chatbotConfig = {
    name: "SupportAI",
    welcome_message: "Hello! How can I help you today?",
    primary_color: "#111827",
  };

  // ==========================================
  // Local Storage
  // ==========================================

  function getSavedMessages() {
    try {
      return JSON.parse(localStorage.getItem(messagesKey)) || [];
    } catch {
      return [];
    }
  }

  function saveMessages(messages) {
    localStorage.setItem(messagesKey, JSON.stringify(messages));
  }

  function clearConversationStorage() {
    localStorage.removeItem(conversationKey);
    localStorage.removeItem(messagesKey);

    conversationId = null;
  }

  // ==========================================
  // Recover from deleted/stale conversation
  // ==========================================

  function resetWidgetConversation(currentMessage) {
    // Remove old conversation from browser storage.
    clearConversationStorage();

    // Clear messages currently displayed in the widget.
    const messagesContainer = container.querySelector(".supportai-messages");

    if (messagesContainer) {
      messagesContainer.innerHTML = "";

      // Start the new conversation with
      // the current chatbot welcome message.
      renderMessage(chatbotConfig.welcome_message, "assistant");

      // Re-add the customer's current message.
      addMessage(currentMessage, "user");
    }
  }

  // ==========================================
  // Load chatbot configuration
  // ==========================================

  async function loadChatbotConfig() {
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/widget/${chatbotId}/config`,
      );

      if (!response.ok) {
        throw new Error("Failed to load chatbot configuration.");
      }

      const data = await response.json();

      chatbotConfig = {
        name: data.name || "SupportAI",

        welcome_message:
          data.welcome_message || "Hello! How can I help you today?",

        primary_color: data.primary_color || "#111827",
      };

      console.log("SupportAI config loaded:", chatbotConfig);
    } catch (error) {
      console.error("SupportAI config error:", error);
    }
  }

  // ==========================================
  // Load CSS
  // ==========================================

  const cssUrl = script.src.replace(/widget\.js(?:\?.*)?$/, "widget.css");

  const stylesheet = document.createElement("link");

  stylesheet.rel = "stylesheet";
  stylesheet.href = cssUrl;

  document.head.appendChild(stylesheet);

  // ==========================================
  // Widget container
  // ==========================================

  const container = document.createElement("div");

  container.id = "supportai-widget";

  document.body.appendChild(container);

  // ==========================================
  // Launcher
  // ==========================================

  function renderLauncher() {
    container.innerHTML = `
      <button
        class="supportai-launcher"
        type="button"
        aria-label="Open SupportAI chat"
      >
        💬
      </button>
    `;

    container
      .querySelector(".supportai-launcher")
      .addEventListener("click", openWidget);
  }

  // ==========================================
  // Open / Close
  // ==========================================

  function openWidget() {
    isOpen = true;

    renderWindow();

    const input = container.querySelector(".supportai-input");

    if (input) {
      input.focus();
    }
  }

  function closeWidget() {
    isOpen = false;

    renderLauncher();
  }

  // ==========================================
  // Render chat window
  // ==========================================

  function renderWindow() {
    const savedMessages = getSavedMessages();

    container.innerHTML = `
      <div class="supportai-window">

        <div class="supportai-header">

          <div class="supportai-header-content">

            <div class="supportai-avatar">
              AI
            </div>

            <div>

              <div class="supportai-title">
                ${escapeHtml(chatbotConfig.name)}
              </div>

              <div class="supportai-status">
                Online
              </div>

            </div>

          </div>

          <button
            class="supportai-close"
            type="button"
            aria-label="Close chat"
          >
            ×
          </button>

        </div>

        <div class="supportai-messages"></div>

        <div class="supportai-input-area">

          <form class="supportai-input-wrapper">

            <input
              class="supportai-input"
              type="text"
              placeholder="Message ${escapeHtml(chatbotConfig.name)}..."
              autocomplete="off"
              maxlength="5000"
            />

            <button
              class="supportai-send"
              type="submit"
              aria-label="Send message"
            >
              ➤
            </button>

          </form>

        </div>

      </div>
    `;

    // Apply chatbot-specific primary color.
    container.style.setProperty(
      "--supportai-primary-color",
      chatbotConfig.primary_color,
    );

    container
      .querySelector(".supportai-close")
      .addEventListener("click", closeWidget);

    container
      .querySelector(".supportai-input-wrapper")
      .addEventListener("submit", handleSubmit);

    const messagesContainer = container.querySelector(".supportai-messages");

    // Restore previous messages.
    if (savedMessages.length > 0) {
      savedMessages.forEach((item) => {
        renderMessage(item.message, item.role);
      });
    } else {
      // Show welcome message from database.
      renderMessage(chatbotConfig.welcome_message, "assistant");
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // ==========================================
  // Submit message
  // ==========================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const input = container.querySelector(".supportai-input");

    const message = input.value.trim();

    if (!message) {
      return;
    }

    // Display customer's message immediately.
    addMessage(message, "user");

    input.value = "";

    setLoading(true);

    try {
      const response = await sendMessage(message);

      // Save the conversation ID returned
      // by the backend.
      conversationId = response.conversation_id;

      localStorage.setItem(conversationKey, conversationId);

      // Display AI response.
      addMessage(response.answer, "assistant");
    } catch (error) {
      console.error("SupportAI:", error);

      addMessage("Sorry, something went wrong. Please try again.", "assistant");
    } finally {
      setLoading(false);

      const currentInput = container.querySelector(".supportai-input");

      if (currentInput) {
        currentInput.focus();
      }
    }
  }

  // ==========================================
  // Send message
  // ==========================================

  async function sendMessage(message, allowRecovery = true) {
    const requestBody = {
      message: message,
    };

    // Only send conversation_id when one exists.
    if (conversationId) {
      requestBody.conversation_id = conversationId;
    }

    const response = await fetch(`${apiUrl}/api/v1/widget/${chatbotId}/chat`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // ========================================
    // Automatic stale conversation recovery
    // ========================================

    if (
      response.status === 404 &&
      data.detail === "Widget conversation not found" &&
      allowRecovery &&
      !isRecoveringConversation
    ) {
      console.log(
        "SupportAI: saved conversation no longer exists. Starting a new conversation.",
      );

      isRecoveringConversation = true;

      try {
        // Remove stale conversation and old
        // local conversation history.
        resetWidgetConversation(message);

        // Retry WITHOUT conversation_id.
        const retryResponse = await sendMessage(message, false);

        return retryResponse;
      } finally {
        isRecoveringConversation = false;
      }
    }

    if (!response.ok) {
      const error = new Error(data.detail || "Widget request failed.");

      error.status = response.status;

      error.detail = data.detail;

      throw error;
    }

    return data;
  }

  // ==========================================
  // Add message
  // ==========================================

  function addMessage(message, role) {
    renderMessage(message, role);

    const messages = getSavedMessages();

    messages.push({
      message,
      role,
    });

    // Keep only the latest 50 messages.
    const recentMessages = messages.slice(-50);

    saveMessages(recentMessages);
  }

  // ==========================================
  // Render message
  // ==========================================

  function renderMessage(message, role) {
    const messages = container.querySelector(".supportai-messages");

    if (!messages) {
      return;
    }

    const messageElement = document.createElement("div");

    messageElement.className = `supportai-message ${role}`;

    const bubble = document.createElement("div");

    bubble.className = "supportai-bubble";

    bubble.innerHTML = formatMessage(message);

    messageElement.appendChild(bubble);

    messages.appendChild(messageElement);

    messages.scrollTop = messages.scrollHeight;
  }

  // ==========================================
  // Message formatting
  // ==========================================

  function formatMessage(message) {
    const escaped = String(message)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return escaped
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  }

  // ==========================================
  // Escape HTML
  // ==========================================

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ==========================================
  // Loading / typing indicator
  // ==========================================

  function setLoading(loading) {
    isLoading = loading;

    const sendButton = container.querySelector(".supportai-send");

    const input = container.querySelector(".supportai-input");

    if (!sendButton || !input) {
      return;
    }

    sendButton.disabled = loading;

    input.disabled = loading;

    const existingTyping = container.querySelector(".supportai-typing-message");

    if (loading && !existingTyping) {
      const messages = container.querySelector(".supportai-messages");

      const messageElement = document.createElement("div");

      messageElement.className =
        "supportai-message assistant supportai-typing-message";

      messageElement.innerHTML = `
        <div class="supportai-bubble">
          <div class="supportai-typing">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      `;

      messages.appendChild(messageElement);

      messages.scrollTop = messages.scrollHeight;
    }

    if (!loading && existingTyping) {
      existingTyping.remove();
    }
  }

  // ==========================================
  // Start widget
  // ==========================================

  loadChatbotConfig().then(() => {
    renderLauncher();
  });
})();

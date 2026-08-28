"use client";

import { useState } from "react";

export default function AIPersonalAssistant({
  user = null,
  role = "user",
}) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const displayName =
    user?.displayName ||
    user?.firstName ||
    "there";

  const askAssistant = async (event) => {
    event?.preventDefault();

    const prompt = question.trim();

    if (!prompt || loading) {
      return;
    }

    setError("");

    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      text: prompt,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/ai/assistant",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            question: prompt,

            context: {
              role,
              userId: user?._id || user?.id || null,
            },
          }),
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      let data = {};

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();

        data = {
          message: text,
        };
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "The AI Personal Assistant could not respond."
        );
      }

      const assistantText =
        data?.data?.response ||
        data?.data?.answer ||
        data?.response ||
        data?.answer ||
        data?.message ||
        "I received your request, but no response was returned.";

      setMessages((current) => [
        ...current,

        {
          id: `assistant-${Date.now()}`,
          type: "assistant",
          text: assistantText,
        },
      ]);
    } catch (assistantError) {
      console.error(
        "PoliSync AI Personal Assistant error:",
        assistantError
      );

      setError(
        assistantError?.message ||
          "Unable to connect to the AI Personal Assistant."
      );
    } finally {
      setLoading(false);
    }
  };

  const useSuggestion = (suggestion) => {
    setQuestion(suggestion);
  };

  return (
    <section className="polisync-ai-personal">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="ai-personal-header">
        <div className="ai-personal-icon">
          🤖
        </div>

        <div className="ai-personal-heading">
          <span className="ai-personal-label">
            PERSONAL AI
          </span>

          <h2>AI Personal Assistant</h2>

          <p>
            Your personal PoliSync assistant,
            {` `}
            {displayName}.
          </p>
        </div>

        <div className="ai-online-status">
          <span />
          Ready
        </div>
      </div>

      {/* ====================================================
          CONVERSATION
      ==================================================== */}

      <div className="ai-personal-conversation">
        {messages.length === 0 ? (
          <div className="ai-personal-welcome">
            <div className="ai-welcome-icon">
              ✦
            </div>

            <strong>
              How can I help you today?
            </strong>

            <p>
              Ask me about your reminders,
              tasks, account, dashboard or
              anything you need help with.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`ai-message ${
                message.type === "user"
                  ? "ai-message-user"
                  : "ai-message-assistant"
              }`}
            >
              <div className="ai-message-avatar">
                {message.type === "user"
                  ? "You"
                  : "AI"}
              </div>

              <div className="ai-message-body">
                {message.text}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="ai-message ai-message-assistant">
            <div className="ai-message-avatar">
              AI
            </div>

            <div className="ai-message-body ai-thinking">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      {/* ====================================================
          SUGGESTIONS
      ==================================================== */}

      <div className="ai-suggestions">
        <button
          type="button"
          onClick={() =>
            useSuggestion(
              "What reminders do I have today?"
            )
          }
        >
          Today's reminders
        </button>

        <button
          type="button"
          onClick={() =>
            useSuggestion(
              "Summarize my recent dashboard activity."
            )
          }
        >
          My activity
        </button>

        <button
          type="button"
          onClick={() =>
            useSuggestion(
              "Help me understand my dashboard."
            )
          }
        >
          Help me
        </button>
      </div>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div
          className="ai-personal-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* ====================================================
          INPUT
      ==================================================== */}

      <form
        className="ai-personal-input-area"
        onSubmit={askAssistant}
      >
        <input
          type="text"
          value={question}
          onChange={(event) =>
            setQuestion(event.target.value)
          }
          placeholder="Ask your personal assistant..."
          disabled={loading}
          maxLength={2000}
          aria-label="Ask AI Personal Assistant"
        />

        <button
          type="submit"
          disabled={
            loading || !question.trim()
          }
          aria-label="Send question"
        >
          {loading ? "..." : "➤"}
        </button>
      </form>

      <div className="ai-personal-footer">
        <span>
          Personal Assistant
        </span>

        <span>
          Role: {formatRole(role)}
        </span>
      </div>

      <style jsx>{`
        .polisync-ai-personal {
          width: 100%;
          padding: 22px;
          border: 1px solid #e3ebe5;
          border-radius: 18px;
          background: #ffffff;
          box-shadow:
            0 8px 24px rgba(17, 65, 36, 0.05);
        }

        .ai-personal-header {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .ai-personal-icon {
          width: 43px;
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 13px;
          background: #eaf5ee;
          border: 1px solid #d9e9de;
          font-size: 21px;
        }

        .ai-personal-heading {
          min-width: 0;
          flex: 1;
        }

        .ai-personal-label {
          display: block;
          color: #c9a227;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.1px;
        }

        .ai-personal-heading h2 {
          margin: 3px 0 0;
          color: #075f2b;
          font-size: 17px;
          font-weight: 850;
        }

        .ai-personal-heading p {
          margin: 3px 0 0;
          color: #808a83;
          font-size: 10px;
        }

        .ai-online-status {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 999px;
          background: #eef8f1;
          color: #267043;
          font-size: 8px;
          font-weight: 800;
        }

        .ai-online-status span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0a8f3c;
        }

        /* ==================================================
           CONVERSATION
        ================================================== */

        .ai-personal-conversation {
          min-height: 155px;
          max-height: 300px;
          margin-top: 17px;
          padding: 13px;
          overflow-y: auto;
          border: 1px solid #edf1ee;
          border-radius: 12px;
          background: #fbfdfb;
        }

        .ai-personal-welcome {
          min-height: 125px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 15px;
        }

        .ai-welcome-icon {
          width: 33px;
          height: 33px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #eaf5ee;
          color: #075f2b;
          font-size: 17px;
        }

        .ai-personal-welcome strong {
          margin-top: 9px;
          color: #435048;
          font-size: 12px;
        }

        .ai-personal-welcome p {
          max-width: 360px;
          margin: 5px 0 0;
          color: #8a938d;
          font-size: 9px;
          line-height: 1.5;
        }

        .ai-message {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }

        .ai-message:last-child {
          margin-bottom: 0;
        }

        .ai-message-user {
          flex-direction: row-reverse;
        }

        .ai-message-avatar {
          width: 25px;
          height: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 50%;
          background: #075f2b;
          color: #ffffff;
          font-size: 7px;
          font-weight: 850;
        }

        .ai-message-assistant .ai-message-avatar {
          background: #c9a227;
        }

        .ai-message-body {
          max-width: 78%;
          padding: 8px 10px;
          border-radius: 10px;
          background: #eaf5ee;
          color: #334139;
          font-size: 10px;
          line-height: 1.5;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .ai-message-user .ai-message-body {
          background: #075f2b;
          color: #ffffff;
        }

        .ai-thinking {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .ai-thinking span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #6f8979;
          animation: ai-pulse 1.2s infinite ease-in-out;
        }

        .ai-thinking span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .ai-thinking span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes ai-pulse {
          0%,
          60%,
          100% {
            opacity: 0.35;
            transform: translateY(0);
          }

          30% {
            opacity: 1;
            transform: translateY(-2px);
          }
        }

        /* ==================================================
           SUGGESTIONS
        ================================================== */

        .ai-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 11px;
        }

        .ai-suggestions button {
          padding: 7px 9px;
          border: 1px solid #dfe8e2;
          border-radius: 999px;
          background: #ffffff;
          color: #526057;
          font-size: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        .ai-suggestions button:hover {
          border-color: #b8d0bf;
          background: #f4f9f5;
          color: #075f2b;
        }

        /* ==================================================
           ERROR
        ================================================== */

        .ai-personal-error {
          margin-top: 9px;
          padding: 9px 10px;
          border: 1px solid #efd0d0;
          border-radius: 8px;
          background: #fff5f5;
          color: #a00000;
          font-size: 9px;
          line-height: 1.4;
        }

        /* ==================================================
           INPUT
        ================================================== */

        .ai-personal-input-area {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 11px;
        }

        .ai-personal-input-area input {
          flex: 1;
          min-width: 0;
          min-height: 42px;
          padding: 10px 12px;
          border: 1px solid #

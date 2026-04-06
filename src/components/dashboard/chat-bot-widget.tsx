"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

function ChatBotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", text: "👋 Hello! Ask me about interns, departments, or feedback." },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (message: ChatMessage) => {
    setMessages((current) => [...current, message]);
  };

  const formatResponse = (payload: any) => {
    if (payload.error) {
      return `Error: ${payload.error}${payload.aiRaw ? `\n\nAI raw response:\n${payload.aiRaw}` : ""}`;
    }

    if (payload.responseText) {
      return payload.responseText;
    }

    const query = payload.graphqlQuery || "";
    const variables = JSON.stringify(payload.variables || {}, null, 2);
    const result = JSON.stringify(payload.result || {}, null, 2);

    return `GraphQL query:\n${query}\n\nVariables:\n${variables}\n\nResult:\n${result}`;
  };

  const handleSend = async () => {
    const question = inputValue.trim();
    if (!question || loading) return;

    addMessage({ id: `${Date.now()}-user`, role: "user", text: question });
    setInputValue("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const payload = await response.json();

      if (!response.ok) {
        const message = payload.error || "Unable to process your request.";
        setError(message);
        addMessage({ id: `${Date.now()}-assistant-error`, role: "assistant", text: message });
      } else {
        addMessage({ id: `${Date.now()}-assistant`, role: "assistant", text: formatResponse(payload) });
      }
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Network error.";
      setError(message);
      addMessage({ id: `${Date.now()}-assistant-error`, role: "assistant", text: `Unable to reach the chat service. ${message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-all duration-300"
          aria-label="Toggle chatbot"
        >
          {open ? <X size={22} /> : <MessageCircle size={22} />}
        </button>
      </div>

      {open && (
        <div className="fixed bottom-20 right-6 w-80 bg-white rounded-3xl shadow-xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-indigo-600 text-white px-4 py-3 font-semibold flex justify-between items-center">
            <span>Assistant</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chatbot">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-80">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-xl p-3 text-sm whitespace-pre-wrap ${
                  message.role === "assistant"
                    ? "bg-slate-100 text-slate-900 self-start"
                    : "bg-indigo-600 text-white self-end"
                }`}
              >
                {message.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t flex gap-2">
            <input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              type="text"
              placeholder="Type a message..."
              className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading}
              className="bg-indigo-600 text-white px-4 rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? "Thinking..." : "Send"}
            </button>
          </div>

          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border-t border-rose-100">
              {error}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default ChatBotWidget;
"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Send, Bot, User, MessageSquareText, Sparkles } from "lucide-react";
import AuthLayout from "@/app/auth-layout";
import { PageLoading } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { chat } from "@/lib/api";
import type { ChatMessage } from "@/types";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chat.history()
      .then((msgs) => setMessages(msgs.reverse()))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    setInput("");
    setSending(true);
    const userMsg = { id: Date.now(), role: "user" as const, content: msg, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await chat.send({ message: msg, history });
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", content: res.reply, created_at: new Date().toISOString() }]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-1 py-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900"> NADY'S AI Account Assistant</h1>
            <p className="text-xs text-slate-400">Ask anything about your finances</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-6 space-y-5 scroll-smooth">
          {loading ? (
            <PageLoading />
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <EmptyState
                icon={<MessageSquareText className="h-12 w-12" />}
                title="Start a conversation"
                description="Ask me about your finances — e.g. 'How much did I spend on rent this month?' or 'Run the monthly audit'"
              />
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex items-start gap-3 px-1 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                  m.role === "user"
                    ? "bg-indigo-600"
                    : "bg-slate-100 ring-1 ring-slate-200"
                }`}>
                  {m.role === "user"
                    ? <User className="h-4 w-4 text-white" />
                    : <Bot className="h-4 w-4 text-slate-600" />
                  }
                </div>
                <div className={`max-w-[80%] ${m.role === "user" ? "text-right" : ""}`}>
                  <div className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-md"
                      : "bg-slate-50 border border-slate-100 text-slate-800 rounded-bl-md shadow-sm"
                  }`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex items-start gap-3 px-1">
              <div className="w-8 h-8 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-slate-600" />
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 pt-4 pb-2">
          <div className="flex items-end gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your finances..."
              rows={1}
              className="flex-1 resize-none text-[15px] outline-none bg-transparent text-slate-900 placeholder:text-slate-400 max-h-32"
              style={{ fieldSizing: "content" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="shrink-0 w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </AuthLayout>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Send, Bot, User, MessageSquareText } from "lucide-react";
import AuthLayout from "@/app/auth-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

  useEffect(() => {
    chat.history()
      .then((msgs) => setMessages(msgs.reverse()))
      .catch(() => toast.error("Failed to load chat history"))
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">NADY'S AI ACCOUNT ASSISTANT</h1>
          <p className="text-slate-500 text-sm mt-1">Ask questions about your finances</p>
        </div>
      </div>

      <Card className="flex flex-col h-[calc(100vh-12rem)]">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <PageLoading />
          ) : messages.length === 0 ? (
            <EmptyState
              icon={<MessageSquareText className="h-12 w-12" />}
              title="Start a conversation"
              description="Ask me about your finances — e.g. 'How much did I spend on rent this month?' or 'Run the monthly audit'"
            />
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role !== "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-xl px-5 py-3.5 text-[15px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-white rounded-tr-md"
                    : "bg-slate-100 text-slate-800 rounded-tl-md"
                }`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))
          )}
          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-slate-100 rounded-xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>
        <div className="border-t p-5">
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={6}
              className="flex-1 resize-y text-[15px] min-h-30 max-h-62.5"
            />
            <Button onClick={sendMessage} loading={sending} className="self-end h-30 px-6 text-base">
              <Send className="h-6 w-6" />
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </Card>
    </AuthLayout>
  );
}

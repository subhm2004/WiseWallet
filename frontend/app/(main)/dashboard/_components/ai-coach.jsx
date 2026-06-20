"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  TrendingDown,
  PiggyBank,
  Target,
  MessageCircle,
  User,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const QUICK_PROMPTS = [
  { text: "Where am I overspending this month?", icon: TrendingDown },
  { text: "How can I save more money?", icon: PiggyBank },
  { text: "Am I on track with my budget?", icon: Target },
];

export function AiFinanceCoach() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const ask = async (q) => {
    const prompt = q || question;
    if (!prompt.trim() || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: prompt }]);
    setQuestion("");
    setLoading(true);

    try {
      const data = await api.analytics.ask(prompt);
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
    } catch (error) {
      toast.error(error.message || "Could not get AI insights");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Sparkles className="h-4 w-4 text-orange-500" />
          <span className="gradient-title text-xl font-bold">AI Finance Coach</span>
        </CardTitle>
        <CardDescription>
          Ask about your spending — answers use your real transaction data
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map(({ text, icon: Icon }) => (
            <button
              key={text}
              type="button"
              onClick={() => ask(text)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border bg-background hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              {text}
            </button>
          ))}
        </div>

        <div className="min-h-[120px] max-h-[260px] overflow-y-auto rounded-lg border bg-muted/40 p-3 space-y-3">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-[96px] text-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                Pick a question or type below
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="h-3 w-3" />
                ) : (
                  <Bot className="h-3 w-3" />
                )}
              </div>
              <div
                className={`max-w-[85%] rounded-md px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border text-foreground"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
                <Bot className="h-3 w-3" />
              </div>
              <div className="rounded-md border bg-background px-3 py-2">
                <div className="flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Ask about your spending..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            disabled={loading}
            className="h-9"
          />
          <Button
            size="icon"
            onClick={() => ask()}
            disabled={loading || !question.trim()}
            className="h-9 w-9 shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

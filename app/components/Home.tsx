'use client';

import type { FC, FormEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, User } from 'lucide-react';
import generateId from './generateId';

type Role = 'user' | 'assistant' | 'system';

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
}

type Provider = 'openai' | 'gemini';

interface ApiResponse {
  message?: ChatMessage;
  error?: string;
}

const Home: FC = function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>('openai');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();
      setError(null);

      const trimmed = input.trim();
      if (!trimmed || isLoading) return;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider,
            messages: [...messages, userMessage],
          }),
        });

        let data: ApiResponse | null = null;

        try {
          data = (await res.json()) as ApiResponse;
        } catch {
          // ignore parse error, keep generic error below
        }

        if (!res.ok) {
          throw new Error(
            data?.error ??
              `Request failed with status ${res.status}`
          );
        }

        if (!data?.message) {
          throw new Error('No message returned from the LLM API');
        }

        setMessages((prev) => [...prev, data!.message]);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while contacting the chat API'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, provider]
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-3xl flex flex-col h-[90vh] md:h-[80vh] border border-slate-800 bg-slate-900/70 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden">
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-lg">
              m
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold tracking-tight">
                mini
              </h1>
              <p className="text-xs text-slate-400">
                ChatGPT / Gemini style assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <label className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1">
              <span className="text-[11px] text-slate-400">Provider</span>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as Provider)}
                className="bg-transparent text-xs focus:outline-none"
              >
                <option className="bg-slate-900" value="openai">
                  OpenAI
                </option>
                <option className="bg-slate-900" value="gemini">
                  Gemini
                </option>
              </select>
            </label>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
              <span>LLM connected</span>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 px-4">
              <div className="mb-4 flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-800">
                <Bot className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold mb-1">
                Welcome to mini
              </h2>
              <p className="text-sm max-w-md">
                This is a simple ChatGPT / Gemini style interface. Choose a
                provider, type a prompt, and get AI responses.
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300 w-full max-w-md">
                <button
                  type="button"
                  onClick={() =>
                    setInput(
                      'Explain what a large language model is in simple terms.'
                    )
                  }
                  className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-left hover:border-emerald-400/60 transition-all duration-200"
                >
                  What is an LLM?
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setInput(
                      'Give me 3 project ideas to learn Next.js and TypeScript.'
                    )
                  }
                  className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-left hover:border-emerald-400/60 transition-all duration-200"
                >
                  Next.js project ideas
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setInput(
                      'Act as a senior engineer and review my web app architecture.'
                    )
                  }
                  className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-left hover:border-emerald-400/60 transition-all duration-200"
                >
                  Review my architecture
                </button>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex max-w-[90%] md:max-w-[80%] gap-2 ${
                  msg.role === 'user'
                    ? 'flex-row-reverse text-right'
                    : 'flex-row'
                }`}
              >
                <div
                  className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full border ${
                    msg.role === 'user'
                      ? 'border-sky-400/70 bg-sky-500/10 text-sky-300'
                      : 'border-emerald-400/70 bg-emerald-500/10 text-emerald-300'
                  }`}
                  aria-hidden="true"
                >
                  {msg.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <article
                  className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-sky-500/10 border border-sky-500/40 text-sky-50'
                      : 'bg-slate-800/80 border border-slate-700 text-slate-100'
                  }`}
                  aria-label={
                    msg.role === 'user' ? 'User message' : 'Assistant message'
                  }
                >
                  {msg.content}
                </article>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/70 bg-emerald-500/10 text-emerald-300">
                <Bot className="h-3 w-3" />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-800/80 px-3 py-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-300" />
                <span>mini is thinking...</span>
              </div>
            </div>
          )}

          {error && (
            <div
              className="mt-2 text-xs text-red-400 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-2"
              role="alert"
            >
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </section>

        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-800 bg-slate-900/80 px-3 sm:px-4 py-3"
        >
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="chat-input" className="sr-only">
                Your message
              </label>
              <textarea
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder="Ask mini anything..."
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading) {
                      e.currentTarget.form?.requestSubmit();
                    }
                  }
                }}
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Press Enter to send, Shift + Enter for a new line.
              </p>
            </div>
            <button
              type="submit"
              disabled={isLoading || input.trim().length === 0}
              className="mb-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default Home;
import { useState, useRef, useEffect, useCallback } from "react";
import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { BubbleBackground } from "@/components/BubbleBackground";
import { ChatMessage } from "@/components/ChatMessage";
import { TypingIndicator } from "@/components/TypingIndicator";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { streamChat, type Msg } from "@/lib/chat-stream";
import { ScrollArea } from "@/components/ui/scroll-area";

const Index = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Msg = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: () => setIsLoading(false),
        onError: (error) => {
          toast.error(error);
          setIsLoading(false);
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Connection failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="relative flex flex-col h-screen overflow-hidden">
      <BubbleBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-center py-3 px-4 border-b border-border/50 bg-background/30 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦞</span>
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-[hsl(var(--claw-coral))]">Open</span>
            <span className="text-foreground">Claw</span>
            <span className="text-muted-foreground font-normal ml-2 text-sm">Docs</span>
          </h1>
        </div>
      </header>

      {/* Chat area */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto px-4 py-6"
        >
          <div className="max-w-3xl mx-auto space-y-6">
            <AnimatePresence mode="wait">
              {messages.length === 0 ? (
                <WelcomeScreen
                  key="welcome"
                  onSuggestionClick={(q) => send(q)}
                />
              ) : (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {messages.map((msg, i) => (
                    <ChatMessage
                      key={i}
                      role={msg.role}
                      content={msg.content}
                      isStreaming={
                        isLoading &&
                        i === messages.length - 1 &&
                        msg.role === "assistant"
                      }
                    />
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <TypingIndicator />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="relative z-10 border-t border-border/50 bg-background/30 backdrop-blur-md p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-card/80 border border-border rounded-2xl px-4 py-2 focus-within:border-[hsl(var(--claw-red)/0.5)] focus-within:shadow-lg focus-within:shadow-[hsl(var(--claw-red)/0.08)] transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Clawbert about OpenClaw..."
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground py-2 max-h-32"
              disabled={isLoading}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--claw-red))] to-[hsl(var(--claw-coral))] flex items-center justify-center text-primary-foreground transition-all hover:scale-105 hover:shadow-lg hover:shadow-[hsl(var(--claw-red)/0.3)] disabled:opacity-40 disabled:hover:scale-100"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
            Clawbert answers based on OpenClaw documentation. EXFOLIATE! 🦞
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;

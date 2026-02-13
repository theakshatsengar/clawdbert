import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { BubbleBackground } from "@/components/BubbleBackground";
import { ChatMessage } from "@/components/ChatMessage";
import { TypingIndicator } from "@/components/TypingIndicator";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { streamChat, type Msg } from "@/lib/chat-stream";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
          <a
            href="https://buymeacoffee.com/theakshatsengar"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-300 text-black text-xs font-semibold hover:bg-amber-200 transition-colors shadow-sm"
          >
            ☕ Buy me a coffee
          </a>
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sidebarRef = useRef<{ reload: () => void }>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const loadConversation = async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data as Msg[]);
      setActiveConvId(convId);
      setSidebarOpen(false);
    }
  };

  const startNew = () => {
    setMessages([]);
    setActiveConvId(null);
    setSidebarOpen(false);
  };

  const saveMessages = async (convId: string, msgs: Msg[]) => {
    // Save only the last user + assistant pair
    const toSave = msgs.slice(-2);
    const rows = toSave.map((m) => ({
      conversation_id: convId,
      role: m.role,
      content: m.content,
    }));
    await supabase.from("messages").insert(rows);

    // Update conversation title from first user message
    if (msgs.filter((m) => m.role === "user").length === 1) {
      const title = msgs.find((m) => m.role === "user")?.content.slice(0, 60) || "New Chat";
      await supabase.from("conversations").update({ title }).eq("id", convId);
    }
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Msg = { role: "user", content: trimmed };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setIsLoading(true);

    // Create conversation if new
    let convId = activeConvId;
    if (!convId) {
      const { data } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: trimmed.slice(0, 60) })
        .select("id")
        .single();
      if (data) {
        convId = data.id;
        setActiveConvId(convId);
      }
    }

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
        messages: newMsgs,
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: async () => {
          setIsLoading(false);
          if (convId) {
            const finalMsgs = [...newMsgs, { role: "assistant" as const, content: assistantSoFar }];
            await saveMessages(convId, finalMsgs);
            // Refresh sidebar
            const event = new CustomEvent("refresh-sidebar");
            window.dispatchEvent(event);
          }
        },
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
    <div className="relative flex h-dvh overflow-hidden">
      <BubbleBackground />

      {/* Desktop sidebar - always visible */}
      <div className="hidden md:flex fixed top-12 bottom-0 left-0 z-10 w-64">
        <SidebarWrapper activeId={activeConvId} onSelect={loadConversation} onNew={startNew} />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-30 md:hidden"
          >
            <SidebarWrapper activeId={activeConvId} onSelect={loadConversation} onNew={startNew} />
          </motion.div>
        )}
      </AnimatePresence>
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-background/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main chat area */}
      <div className="relative z-10 flex-1 flex flex-col h-dvh overflow-hidden md:ml-64">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between py-3 px-4 bg-background/20 backdrop-blur-md h-12">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-muted-foreground hover:text-foreground">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦞</span>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-[hsl(var(--claw-coral))]">Clawd</span>
              <span className="text-foreground">Bert</span>
            </h1>
          </div>
          <div className="w-5" /> {/* Spacer to balance header */}
        </header>

        {/* Spacer for fixed header */}
        <div className="h-12 flex-shrink-0" />

        {/* Chat area */}
        <div className="flex-1 overflow-hidden">
          <div ref={scrollRef} className="h-full overflow-y-auto px-4 py-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <AnimatePresence mode="wait">
                {messages.length === 0 ? (
                  <WelcomeScreen key="welcome" onSuggestionClick={(q) => send(q)} />
                ) : (
                  <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    {messages.map((msg, i) => (
                      <ChatMessage
                        key={i}
                        role={msg.role}
                        content={msg.content}
                        isStreaming={isLoading && i === messages.length - 1 && msg.role === "assistant"}
                      />
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === "user" && <TypingIndicator />}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 bg-background/20 backdrop-blur-md p-4 pb-[env(safe-area-inset-bottom,16px)]">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-card/80 border border-border rounded-2xl px-4 py-2 focus-within:border-[hsl(var(--claw-red)/0.5)] focus-within:shadow-lg focus-within:shadow-[hsl(var(--claw-red)/0.08)] transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask ClawdBert about OpenClaw..."
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
              ClawdBert answers based on OpenClaw documentation. EXFOLIATE! 🦞
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper that listens for refresh events
const SidebarWrapper = ({ activeId, onSelect, onNew }: { activeId: string | null; onSelect: (id: string) => void; onNew: () => void }) => {
  const [key, setKey] = useState(0);

  useEffect(() => {
    const handler = () => setKey((k) => k + 1);
    window.addEventListener("refresh-sidebar", handler);
    return () => window.removeEventListener("refresh-sidebar", handler);
  }, []);

  return <ConversationSidebar key={key} activeId={activeId} onSelect={onSelect} onNew={onNew} />;
};

export default Index;

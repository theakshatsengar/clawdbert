import { useEffect, useState } from "react";
import { Plus, MessageSquare, Trash2, LogOut, Plug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface Props {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export const ConversationSidebar = ({ activeId, onSelect, onNew }: Props) => {
  const { user, signOut } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false });
    if (data) setConversations(data);
  };

  useEffect(() => {
    load();
  }, [user]);

  const deleteConv = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) onNew();
  };

  return (
    <div className="flex flex-col h-full bg-card/30 border-r border-border/30 w-64 backdrop-blur-xl shadow-2xl shadow-background/50">
      <div className="p-3 border-b border-border">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <AnimatePresence>
          {conversations.map((c) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={() => onSelect(c.id)}
              className={`w-full group flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-colors ${
                activeId === c.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate flex-1">{c.title}</span>
              <Trash2
                className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 flex-shrink-0 text-destructive"
                onClick={(e) => deleteConv(c.id, e)}
              />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-3 border-t border-border/30 space-y-1">
        <a
          href="/mcp"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Plug className="w-4 h-4" />
          MCP Server
        </a>
        <a
          href="https://buymeacoffee.com/theakshatsengar"
          target="_blank"
          rel="noopener noreferrer"
          className="md:hidden w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-300 text-black text-sm font-semibold hover:bg-amber-200 transition-colors mb-2"
        >
          ☕ Buy me a coffee
        </a>

        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

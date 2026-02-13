import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Copy, Plus, Trash2, ArrowLeft, Key, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BubbleBackground } from "@/components/BubbleBackground";
import { ConversationSidebar } from "@/components/ConversationSidebar";

interface ApiKeyRow {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

const McpSettings = () => {
  const { user, loading, session } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const mcpUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mcp-server`;

  useEffect(() => {
    if (user) loadKeys();
  }, [user]);

  const loadKeys = async () => {
    const { data } = await supabase
      .from("mcp_api_keys")
      .select("id, name, created_at, last_used_at")
      .order("created_at", { ascending: false });
    if (data) setKeys(data);
  };

  const generateKey = async () => {
    if (!session) return;
    setGenerating(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-mcp-key`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ name: newKeyName || "Default" }),
        }
      );
      const data = await resp.json();
      if (data.key) {
        setGeneratedKey(data.key);
        setNewKeyName("");
        loadKeys();
        toast.success("API key generated!");
      } else {
        toast.error(data.error || "Failed to generate key");
      }
    } catch {
      toast.error("Failed to generate key");
    } finally {
      setGenerating(false);
    }
  };

  const deleteKey = async (id: string) => {
    if (!session) return;
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-mcp-key`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id }),
      }
    );
    setKeys((prev) => prev.filter((k) => k.id !== id));
    toast.success("Key deleted");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="relative flex h-dvh">
      <BubbleBackground />

      {/* Desktop sidebar */}
      <div className="hidden md:block fixed top-12 bottom-0 left-0 z-20 w-64">
        <ConversationSidebar activeId={null} onSelect={() => {}} onNew={() => {}} />
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
            <ConversationSidebar activeId={null} onSelect={() => {}} onNew={() => {}} />
          </motion.div>
        )}
      </AnimatePresence>
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-background/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content area */}
      <div className="relative z-10 flex-1 flex flex-col h-dvh overflow-auto md:ml-64">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-20 flex items-center py-3 px-4 bg-background/20 backdrop-blur-md h-12">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-muted-foreground hover:text-foreground">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-2xl">🦞</span>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-[hsl(var(--claw-coral))]">Clawd</span>
              <span className="text-foreground">Bert</span>
            </h1>
          </div>

          <div className="ml-auto hidden sm:flex items-center">
            <a
              href="https://www.buymeacoffee.com/snooooofy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm bg-amber-400 text-amber-900 px-3 py-1.5 rounded-lg hover:opacity-90"
            >
              ☕ Buy me a coffee
            </a>
          </div>
        </header>

        <div className="h-12 flex-shrink-0" />

        <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">

        <h1 className="text-2xl font-bold mb-1 text-foreground">MCP Server Settings</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Use ClawdBert as an MCP tool in other AI apps like Claude Desktop, Cursor, etc.
        </p>

        {/* Server URL */}
        <div className="bg-card/60 backdrop-blur-md border border-border/40 rounded-2xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-2">MCP Server URL</h2>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted/50 px-3 py-2 rounded-lg text-foreground break-all">
              {mcpUrl}
            </code>
            <button
              onClick={() => copyToClipboard(mcpUrl)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Config example */}
        <div className="bg-card/60 backdrop-blur-md border border-border/40 rounded-2xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-2">Example Configuration</h2>
          <p className="text-xs text-muted-foreground mb-3">Add this to your MCP client config (e.g. Claude Desktop, Cursor):</p>
          <div className="relative">
            <pre className="text-xs bg-muted/50 px-3 py-3 rounded-lg text-foreground overflow-x-auto">
{`{
  "mcpServers": {
    "clawdbert": {
      "url": "${mcpUrl}",
      "headers": {
        "Authorization": "Bearer <YOUR_API_KEY>"
      }
    }
  }
}`}
            </pre>
            <button
              onClick={() =>
                copyToClipboard(
                  JSON.stringify(
                    {
                      mcpServers: {
                        clawdbert: {
                          url: mcpUrl,
                          headers: { Authorization: "Bearer <YOUR_API_KEY>" },
                        },
                      },
                    },
                    null,
                    2
                  )
                )
              }
              className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Generate key */}
        <div className="bg-card/60 backdrop-blur-md border border-border/40 rounded-2xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Key className="w-4 h-4" /> API Keys
          </h2>

          {generatedKey && (
            <div className="mb-4 p-3 rounded-xl bg-[hsl(var(--claw-coral)/0.1)] border border-[hsl(var(--claw-coral)/0.3)]">
              <p className="text-xs font-semibold text-[hsl(var(--claw-coral))] mb-1">
                🔑 Save this key — it won't be shown again!
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background/50 px-2 py-1.5 rounded text-foreground break-all">
                  {generatedKey}
                </code>
                <button
                  onClick={() => copyToClipboard(generatedKey)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (optional)"
              className="flex-1 text-sm bg-muted/50 border border-border/40 rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:border-[hsl(var(--claw-coral)/0.5)]"
            />
            <button
              onClick={generateKey}
              disabled={generating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-br from-[hsl(var(--claw-red))] to-[hsl(var(--claw-coral))] text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Generate
            </button>
          </div>

          {/* Key list */}
          <div className="space-y-2">
            {keys.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No API keys yet. Generate one to get started.
              </p>
            )}
            {keys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/20"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{k.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Created {new Date(k.created_at).toLocaleDateString()}
                    {k.last_used_at && ` · Last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => deleteKey(k.id)}
                  className="p-1.5 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default McpSettings;

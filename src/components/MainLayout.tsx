import { useState, useEffect, useState as _useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BubbleBackground } from "@/components/BubbleBackground";
import { ConversationSidebar } from "@/components/ConversationSidebar";

// Wrapper that listens for refresh events
const SidebarWrapper = ({ activeId, onSelect, onNew }: { activeId: string | null; onSelect?: (id: string) => void; onNew?: () => void }) => {
  const [key, setKey] = _useState(0);

  useEffect(() => {
    const handler = () => setKey((k) => k + 1);
    window.addEventListener("refresh-sidebar", handler);
    return () => window.removeEventListener("refresh-sidebar", handler);
  }, []);

  return <ConversationSidebar key={key} activeId={activeId} onSelect={onSelect || (() => {})} onNew={onNew || (() => {})} />;
};

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex h-dvh overflow-hidden">
      <BubbleBackground />

      {/* Desktop sidebar */}
      <div className="hidden md:flex fixed top-12 bottom-0 left-0 z-10 w-64">
        <SidebarWrapper activeId={null} />
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
            <SidebarWrapper activeId={null} onSelect={() => setSidebarOpen(false)} onNew={() => setSidebarOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-background/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content area */}
      <div className="relative z-10 flex-1 flex flex-col h-dvh overflow-hidden md:ml-64">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-start md:justify-between py-3 px-4 bg-background/20 backdrop-blur-md h-12">
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
        </header>

        <div className="h-12 flex-shrink-0" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;

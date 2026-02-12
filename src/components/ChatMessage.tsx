import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LobsterMascot } from "./LobsterMascot";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export const ChatMessage = ({ role, content, isStreaming = false }: ChatMessageProps) => {
  const isUser = role === "user";
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar - hidden on mobile for assistant */}
      <div className={`flex-shrink-0 mt-1 ${!isUser && isMobile ? "hidden" : ""}`}>
        {isUser ? (
          avatarUrl ? (
            <img src={avatarUrl} alt="You" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[hsl(var(--claw-coral))] to-[hsl(var(--claw-red))] flex items-center justify-center text-xs font-bold text-primary-foreground">
              U
            </div>
          )
        ) : (
          <div className="text-lg">🦞</div>
        )}
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-gradient-to-br from-[hsl(var(--claw-red))] to-[hsl(var(--claw-coral))] text-primary-foreground rounded-tr-sm"
            : "bg-card border border-border rounded-tl-sm shadow-lg shadow-[hsl(var(--claw-red)/0.05)]"
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose-openclaw text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            {isStreaming && (
              <motion.span
                className="inline-block w-2 h-4 bg-[hsl(var(--claw-coral))] ml-0.5"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

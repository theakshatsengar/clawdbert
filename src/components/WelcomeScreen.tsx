import { motion } from "framer-motion";
import { LobsterMascot } from "./LobsterMascot";

interface WelcomeScreenProps {
  onSuggestionClick: (question: string) => void;
}

const SUGGESTIONS = [
  "How do I set up OpenClaw?",
  "What channels does OpenClaw support?",
  "How do webhooks work?",
  "What are skills and ClawHub?",
];

export const WelcomeScreen = ({ onSuggestionClick }: WelcomeScreenProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="flex flex-col items-center justify-center flex-1 px-4 py-8"
  >
    <LobsterMascot size="lg" />

    <p className="text-muted-foreground text-center mb-1 text-sm mt-4">
      The AI That Actually Does Things
    </p>
    <p className="text-muted-foreground/60 text-center mb-8 text-xs max-w-md">
      I'm <span className="text-[hsl(var(--claw-coral))] font-semibold">ClawdBert</span>, your friendly OpenClaw docs assistant. Ask me anything!
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
      {SUGGESTIONS.map((q, i) => (
        <motion.button
          key={q}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.1 }}
          onClick={() => onSuggestionClick(q)}
          className="group text-left px-4 py-3 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-[hsl(var(--claw-red)/0.4)] transition-all duration-200 hover:shadow-lg hover:shadow-[hsl(var(--claw-red)/0.08)]"
        >
          <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
            {q}
          </span>
        </motion.button>
      ))}
    </div>
  </motion.div>
);

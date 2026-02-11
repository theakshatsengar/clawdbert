import { motion } from "framer-motion";

export const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center gap-3 px-2"
  >
    <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border">
      {/* Animated claw pincers */}
      <span className="text-lg animate-claw-snap" style={{ display: "inline-block" }}>🦀</span>
      <div className="flex gap-1 ml-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-[hsl(var(--claw-coral))]"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  </motion.div>
);

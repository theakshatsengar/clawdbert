import { motion } from "framer-motion";

interface LobsterMascotProps {
  isThinking?: boolean;
  size?: "sm" | "md" | "lg";
}

export const LobsterMascot = ({ isThinking = false, size = "md" }: LobsterMascotProps) => {
  const sizeMap = { sm: 48, md: 80, lg: 120 };
  const px = sizeMap[size];

  return (
    <motion.div
      className="relative inline-flex items-center justify-center"
      animate={isThinking ? { rotate: [0, -5, 5, -3, 3, 0] } : {}}
      transition={isThinking ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" } : {}}
    >
      {/* Glow behind lobster */}
      <div
        className={`absolute rounded-full ${isThinking ? "animate-glow-pulse" : ""}`}
        style={{
          width: px * 1.4,
          height: px * 1.4,
          background: `radial-gradient(circle, hsl(var(--claw-red) / 0.25), transparent 70%)`,
        }}
      />

      {/* Lobster emoji - big and bold */}
      <span
        className="relative z-10 select-none"
        style={{ fontSize: px * 0.75 }}
        role="img"
        aria-label="Lobster mascot"
      >
        🦞
      </span>

      {/* Eye glow */}
      {isThinking && (
        <motion.div
          className="absolute z-20 rounded-full"
          style={{
            width: 6,
            height: 6,
            top: "30%",
            left: "55%",
            background: "hsl(var(--claw-green))",
            boxShadow: "0 0 8px 2px hsl(var(--claw-green) / 0.8)",
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

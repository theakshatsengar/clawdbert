import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { BubbleBackground } from "@/components/BubbleBackground";
import { LobsterMascot } from "@/components/LobsterMascot";
import { toast } from "sonner";

const Auth = () => {
  const { user, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const error = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);
    setSubmitting(false);

    if (error) {
      toast.error(error);
    } else if (isSignUp) {
      toast.success("Check your email for a confirmation link!");
    }
  };

  return (
    <div className="relative flex flex-col h-screen items-center justify-center overflow-hidden">
      <BubbleBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm mx-auto px-4"
      >
        <div className="flex flex-col items-center mb-6">
          <LobsterMascot size="lg" />
          <h1 className="text-xl font-bold mt-3">
            <span className="text-[hsl(var(--claw-coral))]">Open</span>
            <span className="text-foreground">Claw</span>
            <span className="text-muted-foreground font-normal ml-2 text-sm">Docs</span>
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card/80 border border-border rounded-2xl p-6 space-y-4 backdrop-blur-md"
        >
          <h2 className="text-lg font-semibold text-center">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[hsl(var(--claw-red)/0.5)] transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[hsl(var(--claw-red)/0.5)] transition-colors"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[hsl(var(--claw-red))] to-[hsl(var(--claw-coral))] text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[hsl(var(--claw-coral))] hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Auth;

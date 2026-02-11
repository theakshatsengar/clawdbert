

# 🦞 OpenClaw Docs Chatbot — Lobster-Themed AI Assistant

## Overview
A fully immersive, lobster-themed chatbot that lets users ask questions about the OpenClaw documentation and get AI-powered answers. The docs will be pre-scraped and embedded as context, and the UI will feature a deep-sea/lobster aesthetic with rich animations.

---

## 1. Visual Design & Theme
- **Dark deep-sea background** with subtle gradient (dark navy → dark teal/black), inspired by the OpenClaw branding in the uploaded image
- **Red/coral accent colors** matching the OpenClaw lobster mascot throughout the UI
- **Animated lobster mascot** displayed prominently — bounces/wiggles when "thinking", with glowing green eyes
- **Bubble particle effects** floating up in the background for an underwater feel
- **Claw-shaped send button** and lobster-themed UI elements (rounded "shell" cards for messages)
- **Chat bubbles**: user messages in coral/red tones, assistant messages in dark translucent cards with subtle glow borders
- **Typing indicator** with animated claw pincers snapping

## 2. Chat Interface
- **Full-screen chat experience** — centered chat window with the lobster mascot above it
- **Welcome screen** with the OpenClaw logo, tagline "The AI That Actually Does Things", and suggested starter questions like:
  - "How do I set up OpenClaw?"
  - "What channels does OpenClaw support?"
  - "How do webhooks work?"
  - "What are bootstrap files?"
- **Streaming responses** — tokens appear in real-time as the AI generates answers
- **Markdown rendering** for formatted responses (code blocks, headers, lists)
- **Message history** maintained during the session

## 3. Documentation Knowledge Base
- **Pre-scrape key OpenClaw docs** from the GitHub repository (automation, channels, CLI, concepts, gateway, etc.)
- **Store as structured context** that gets sent to the AI with each query
- **System prompt** instructs the AI to answer only based on OpenClaw docs, stay in character as a helpful lobster assistant, and cite relevant doc sections

## 4. AI Backend
- **Lovable Cloud + Lovable AI** integration using an edge function
- **Streaming SSE responses** for real-time token rendering
- The AI will be prompted to act as "Clawbert" — a friendly lobster expert on OpenClaw documentation
- Handles rate limits (429) and payment errors (402) with friendly error toasts

## 5. Animations & Polish
- **Fade-in animations** for new messages
- **Lobster mascot reactions** — idle animation, thinking animation, happy animation on successful answers
- **Floating bubble particles** in the background
- **Smooth scroll** to latest message
- **Responsive design** — works beautifully on mobile with the lobster mascot scaling down


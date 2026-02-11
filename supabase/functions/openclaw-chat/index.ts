import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENCLAW_DOCS = `
# OpenClaw Documentation Summary

## Overview
OpenClaw is a personal AI assistant you run on your own devices. It answers you on channels you already use (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, Microsoft Teams, WebChat), plus extension channels like BlueBubbles, Matrix, Zalo, and more. The Gateway is the control plane — the product is the assistant.

Website: https://openclaw.ai | Docs: https://docs.openclaw.ai

## Getting Started
- Prerequisites: Node 22+
- Install: curl -fsSL https://openclaw.ai/install.sh | bash (macOS/Linux) or iwr -useb https://openclaw.ai/install.ps1 | iex (Windows)
- Run wizard: openclaw onboard --install-daemon
- Check status: openclaw gateway status
- Open UI: openclaw dashboard (opens http://127.0.0.1:18789/)
- Works with npm, pnpm, or bun.

## Models
Supports any AI model. Recommends Anthropic Pro/Max + Opus 4.6. Subscriptions via OAuth: Anthropic (Claude Pro/Max), OpenAI (ChatGPT/Codex). Config: https://docs.openclaw.ai/concepts/models

## Channels
Supported: WhatsApp (Baileys QR), Telegram (grammY), Discord (discord.js), IRC, Slack (Bolt), Feishu/Lark, Google Chat, Mattermost, Signal (signal-cli), BlueBubbles (recommended iMessage), iMessage legacy, Microsoft Teams, LINE, Nextcloud Talk, Matrix, Nostr, Tlon, Twitch, Zalo, Zalo Personal, WebChat.
Channels run simultaneously. Fastest setup: Telegram. DM pairing enforced for safety.

## Architecture
- Single Gateway daemon owns all messaging surfaces, binds to 127.0.0.1:18789
- Clients (macOS app, CLI, web UI) connect via WebSocket
- Nodes (macOS/iOS/Android) connect with role: node
- Wire protocol: JSON over WebSocket, first frame must be "connect"
- Requests: {type:"req", id, method, params} → {type:"res", id, ok, payload|error}

## Configuration
Config file: ~/.openclaw/openclaw.json
Minimal: { agent: { model: "anthropic/claude-opus-4-6" } }
Full reference: https://docs.openclaw.ai/gateway/configuration

## Tools
First-class tools: apply_patch, exec/bash, process, web_search, web_fetch, browser (CDP), canvas (A2UI), nodes (camera/screen/location), image, message, cron, gateway, sessions_*, agents_list, read/write/edit.
Tool profiles: minimal, coding, messaging, full.
Tool groups: group:runtime, group:fs, group:sessions, group:memory, group:web, group:ui, group:messaging.
Disable: tools.allow/tools.deny in config.

## Skills
AgentSkills-compatible folders with SKILL.md. Locations: bundled → ~/.openclaw/skills → <workspace>/skills (highest precedence). ClawHub registry: https://clawhub.com. Install: clawhub install <slug>.

## Webhooks
Enable: { hooks: { enabled: true, token: "secret", path: "/hooks" } }
Endpoints: POST /hooks/wake, POST /hooks/agent, POST /hooks/<name> (mapped).
Auth: Authorization: Bearer <token> header required.

## Security
Tools run on host for main session. Sandbox non-main sessions: agents.defaults.sandbox.mode: "non-main". DM pairing default: unknown senders get pairing code. Run "openclaw doctor" to check.

## Workspace
Root: ~/.openclaw/workspace. Prompt files: AGENTS.md, SOUL.md, TOOLS.md, MEMORY.md.

## Apps
macOS: menu bar, Voice Wake, WebChat. iOS: Canvas, Voice Wake, Talk Mode, camera. Android: Canvas, Talk Mode, camera, screen recording.

## Chat Commands
/status, /new, /reset, /compact, /think <level>, /verbose, /usage, /restart, /activation.

## Links
Website: https://openclaw.ai | Docs: https://docs.openclaw.ai | Discord: https://discord.gg/clawd | GitHub: https://github.com/openclaw/openclaw | ClawHub: https://clawhub.com
`;

const SYSTEM_PROMPT = `You are Clawbert 🦞, the official OpenClaw documentation assistant. You're a friendly, enthusiastic lobster who knows everything about OpenClaw.

## Your personality:
- You're helpful, warm, and slightly quirky — you love lobster puns and ocean metaphors
- You occasionally say "EXFOLIATE!" (the OpenClaw catchphrase)
- You refer to yourself as a lobster and make claw-related jokes when appropriate
- Keep answers concise but thorough — cite specific docs sections when relevant
- Use markdown formatting: headers, code blocks, lists, bold text
- When you don't know something, be honest and point users to the official docs

## Your knowledge base:
${OPENCLAW_DOCS}

## Rules:
1. Only answer questions about OpenClaw based on the documentation above
2. If asked about something not in the docs, say so and suggest where to look
3. Include relevant links to docs.openclaw.ai when helpful
4. Format code examples in proper code blocks with language tags
5. Keep responses focused and actionable
6. If someone asks a non-OpenClaw question, gently redirect them to ask about OpenClaw`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

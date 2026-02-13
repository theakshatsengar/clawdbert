import { Hono } from "https://deno.land/x/hono@v4.3.11/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

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

## Models
Supports any AI model. Recommends Anthropic Pro/Max + Opus 4.6. Config: https://docs.openclaw.ai/concepts/models

## Channels
Supported: WhatsApp, Telegram, Discord, IRC, Slack, Feishu/Lark, Google Chat, Mattermost, Signal, BlueBubbles, iMessage, Microsoft Teams, LINE, Nextcloud Talk, Matrix, Nostr, Tlon, Twitch, Zalo, WebChat.

## Architecture
- Single Gateway daemon owns all messaging surfaces, binds to 127.0.0.1:18789
- Clients connect via WebSocket
- Wire protocol: JSON over WebSocket

## Configuration
Config file: ~/.openclaw/openclaw.json
Minimal: { agent: { model: "anthropic/claude-opus-4-6" } }

## Tools
First-class tools: apply_patch, exec/bash, process, web_search, web_fetch, browser, canvas, nodes, image, message, cron, gateway, sessions_*, agents_list, read/write/edit.

## Skills
AgentSkills-compatible folders with SKILL.md. ClawHub registry: https://clawhub.com.

## Webhooks
Enable: { hooks: { enabled: true, token: "secret", path: "/hooks" } }

## Links
Website: https://openclaw.ai | Docs: https://docs.openclaw.ai | Discord: https://discord.gg/clawd | GitHub: https://github.com/openclaw/openclaw
`;

const SYSTEM_PROMPT = `You are ClawdBert 🦞, the official OpenClaw documentation assistant. You're a friendly, enthusiastic lobster who knows everything about OpenClaw.

Your personality:
- Helpful, warm, and slightly quirky — you love lobster puns
- You occasionally say "EXFOLIATE!"
- Keep answers concise but thorough
- Use markdown formatting
- Only answer questions about OpenClaw based on the documentation
- If asked about something not in the docs, say so

Knowledge base:
${OPENCLAW_DOCS}`;

async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function validateApiKey(apiKey: string): Promise<{ valid: boolean; userId?: string }> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const keyHash = await hashKey(apiKey);
  const { data, error } = await supabase
    .from("mcp_api_keys")
    .select("id, user_id")
    .eq("key_hash", keyHash)
    .single();

  if (error || !data) return { valid: false };

  // Update last_used_at
  await supabase
    .from("mcp_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return { valid: true, userId: data.user_id };
}

async function chatWithClawdBert(messages: { role: string; content: string }[]): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      stream: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI gateway error: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No response generated.";
}

// MCP Protocol types
interface McpRequest {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

const SERVER_INFO = {
  name: "clawdbert-mcp",
  version: "1.0.0",
};

const TOOLS = [
  {
    name: "ask_clawdbert",
    description:
      "Ask ClawdBert 🦞 a question about OpenClaw. ClawdBert is the official OpenClaw documentation assistant that knows everything about installation, configuration, channels, tools, skills, and more.",
    inputSchema: {
      type: "object" as const,
      properties: {
        question: {
          type: "string",
          description: "The question to ask ClawdBert about OpenClaw",
        },
      },
      required: ["question"],
    },
  },
];

function handleMcpRequest(request: McpRequest): Record<string, unknown> | Promise<Record<string, unknown>> {
  switch (request.method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        },
      };

    case "notifications/initialized":
      return { jsonrpc: "2.0" };

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: { tools: TOOLS },
      };

    case "tools/call":
      return handleToolCall(request);

    default:
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32601, message: `Method not found: ${request.method}` },
      };
  }
}

async function handleToolCall(request: McpRequest): Promise<Record<string, unknown>> {
  const toolName = (request.params as { name?: string })?.name;
  const args = (request.params as { arguments?: Record<string, unknown> })?.arguments || {};

  if (toolName !== "ask_clawdbert") {
    return {
      jsonrpc: "2.0",
      id: request.id,
      error: { code: -32602, message: `Unknown tool: ${toolName}` },
    };
  }

  const question = args.question as string;
  if (!question) {
    return {
      jsonrpc: "2.0",
      id: request.id,
      error: { code: -32602, message: "Missing required parameter: question" },
    };
  }

  try {
    const answer = await chatWithClawdBert([{ role: "user", content: question }]);
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        content: [{ type: "text", text: answer }],
      },
    };
  } catch (e) {
    return {
      jsonrpc: "2.0",
      id: request.id,
      error: { code: -32000, message: e instanceof Error ? e.message : "Unknown error" },
    };
  }
}

const app = new Hono();

// CORS preflight
app.options("*", (c) => new Response(null, { headers: corsHeaders }));

// MCP endpoint - Streamable HTTP transport
app.post("/*", async (c) => {
  // Auth check
  const authHeader = c.req.header("Authorization");
  const apiKey = authHeader?.replace("Bearer ", "");

  if (!apiKey) {
    return c.json(
      { jsonrpc: "2.0", error: { code: -32000, message: "Missing Authorization header. Use Bearer <your-api-key>" } },
      { status: 401, headers: corsHeaders }
    );
  }

  const { valid } = await validateApiKey(apiKey);
  if (!valid) {
    return c.json(
      { jsonrpc: "2.0", error: { code: -32000, message: "Invalid API key" } },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const body = await c.req.json();
    const result = await handleMcpRequest(body as McpRequest);
    return c.json(result, { headers: corsHeaders });
  } catch (e) {
    return c.json(
      { jsonrpc: "2.0", error: { code: -32700, message: "Parse error" } },
      { status: 400, headers: corsHeaders }
    );
  }
});

// Info endpoint
app.get("/*", (c) => {
  return c.json(
    {
      name: SERVER_INFO.name,
      version: SERVER_INFO.version,
      description: "ClawdBert MCP Server - Ask questions about OpenClaw documentation",
      auth: "Bearer token required. Generate API keys from the ClawdBert web app.",
    },
    { headers: corsHeaders }
  );
});

Deno.serve(app.fetch);

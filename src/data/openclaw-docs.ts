// Pre-scraped OpenClaw documentation context for the AI chatbot
export const OPENCLAW_DOCS = `
# OpenClaw Documentation

## Overview
OpenClaw is a personal AI assistant you run on your own devices. It answers you on the channels you already use (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, Microsoft Teams, WebChat), plus extension channels like BlueBubbles, Matrix, Zalo, and more. It can speak and listen on macOS/iOS/Android, and can render a live Canvas you control. The Gateway is just the control plane — the product is the assistant.

Website: https://openclaw.ai | Docs: https://docs.openclaw.ai

## Getting Started
Goal: go from zero to a first working chat with minimal setup.

### Prerequisites
- Node 22 or newer

### Quick Setup (CLI)
1. Install OpenClaw:
   - macOS/Linux: curl -fsSL https://openclaw.ai/install.sh | bash
   - Windows (PowerShell): iwr -useb https://openclaw.ai/install.ps1 | iex
2. Run the onboarding wizard: openclaw onboard --install-daemon
3. Check the Gateway: openclaw gateway status
4. Open the Control UI: openclaw dashboard

Fastest chat: open the Control UI (no channel setup needed). Run "openclaw dashboard" and chat in the browser, or open http://127.0.0.1:18789/ on the gateway host.

Preferred setup: run "openclaw onboard" in your terminal. The wizard guides you through setting up the gateway, workspace, channels, and skills. Works on macOS, Linux, and Windows (via WSL2).

### Models
OpenClaw supports any AI model but strongly recommends Anthropic Pro/Max (100/200) + Opus 4.6 for long-context strength and better prompt-injection resistance. Models config + CLI: https://docs.openclaw.ai/concepts/models. Auth profile rotation (OAuth vs API keys) + fallbacks: https://docs.openclaw.ai/concepts/model-failover.

Subscriptions (OAuth): Anthropic (Claude Pro/Max) and OpenAI (ChatGPT/Codex).

## Chat Channels
OpenClaw can talk to you on any chat app you already use. Each channel connects via the Gateway. Supported channels:

- **WhatsApp** — Most popular; uses Baileys and requires QR pairing.
- **Telegram** — Bot API via grammY; supports groups. Set TELEGRAM_BOT_TOKEN or channels.telegram.botToken.
- **Discord** — Discord Bot API + Gateway; supports servers, channels, and DMs. Set DISCORD_BOT_TOKEN or channels.discord.token.
- **IRC** — Classic IRC servers; channels + DMs with pairing/allowlist controls.
- **Slack** — Bolt SDK; workspace apps. Set SLACK_BOT_TOKEN + SLACK_APP_TOKEN.
- **Google Chat** — Google Chat API app via HTTP webhook.
- **Signal** — signal-cli; privacy-focused.
- **BlueBubbles** — Recommended for iMessage; uses BlueBubbles macOS server REST API.
- **iMessage (legacy)** — Legacy macOS integration via imsg CLI (deprecated).
- **Microsoft Teams** — Bot Framework; enterprise support.
- **Matrix** — Matrix protocol (plugin).
- **Zalo** — Zalo Bot API; Vietnam's popular messenger.
- **WebChat** — Gateway WebChat UI over WebSocket.
- **LINE**, **Nextcloud Talk**, **Nostr**, **Tlon**, **Twitch**, **Feishu/Lark**, **Mattermost** — Available as plugins.

Notes: Channels can run simultaneously. Fastest setup is usually Telegram (simple bot token). DM pairing and allowlists are enforced for safety.

## Gateway Architecture
- A single long-lived Gateway owns all messaging surfaces.
- Control-plane clients connect over WebSocket on default 127.0.0.1:18789.
- Nodes (macOS/iOS/Android/headless) also connect over WebSocket with role: node.
- One Gateway per host; it is the only place that opens a WhatsApp session.
- A canvas host (default 18793) serves agent-editable HTML and A2UI.

### Components
- **Gateway (daemon)**: Maintains provider connections, exposes typed WS API, validates inbound frames, emits events.
- **Clients**: One WS connection per client. Send requests (health, status, send, agent).
- **Nodes**: Connect with role: node, expose commands like canvas.*, camera.*, screen.record, location.get.
- **WebChat**: Static UI using Gateway WS API for chat.

### Wire Protocol
- Transport: WebSocket, text frames with JSON payloads.
- First frame must be "connect".
- Requests: {type:"req", id, method, params} → {type:"res", id, ok, payload|error}
- Events: {type:"event", event, payload, seq?, stateVersion?}
- Idempotency keys required for side-effecting methods.

## Configuration
Config file: ~/.openclaw/openclaw.json

Minimal config:
{
  agent: {
    model: "anthropic/claude-opus-4-6",
  },
}

Full configuration reference: https://docs.openclaw.ai/gateway/configuration
Strict config validation is enabled by default. Schema + UI hints provide structured guidance.

## Tools
OpenClaw exposes first-class agent tools for browser, canvas, nodes, and cron. These replace old skills: typed, no shelling.

### Tool Inventory
- **apply_patch**: Apply unified diffs to files
- **exec/bash**: Run shell commands
- **process**: Manage background processes
- **web_search**: Search the web
- **web_fetch**: Fetch web page content
- **browser**: Dedicated openclaw Chrome/Chromium with CDP control, snapshots, actions, uploads, profiles
- **canvas**: A2UI push/reset, eval, snapshot — agent-driven visual workspace
- **nodes**: Camera snap/clip, screen record, location.get, notifications
- **image**: Generate/edit images
- **message**: Send messages to channels
- **cron**: Schedule recurring tasks + wakeups
- **gateway**: Gateway management tools
- **sessions_***: Agent-to-agent coordination (list, history, send, spawn, status)
- **agents_list**: List available agents
- **read/write/edit**: File operations

### Tool Profiles
- minimal: session_status only
- coding: group:fs, group:runtime, group:sessions, group:memory, image
- messaging: group:messaging, sessions_list, sessions_history, sessions_send, session_status
- full: no restriction

### Tool Groups
- group:runtime: exec, bash, process
- group:fs: read, write, edit, apply_patch
- group:sessions: sessions_list, sessions_history, sessions_send, sessions_spawn, session_status
- group:memory: memory_search, memory_get
- group:web: web_search, web_fetch
- group:ui: browser, canvas
- group:messaging: message, discord, slack

Disabling tools: tools.allow / tools.deny in openclaw.json.

## Skills
OpenClaw uses AgentSkills-compatible skill folders. Each skill is a directory containing SKILL.md with YAML frontmatter and instructions.

### Locations and Precedence
1. Bundled skills (shipped with install)
2. Managed/local skills (~/.openclaw/skills)
3. Workspace skills (<workspace>/skills) — highest precedence

### ClawHub
Public skills registry at https://clawhub.com. Install: clawhub install <skill-slug>. Update: clawhub update --all.

### Skill Format
SKILL.md requires at minimum:
---
name: skill-name
description: What the skill does
---

Skills can be gated based on environment, config, and binary presence.

## Webhooks
Gateway can expose HTTP webhook endpoints for external triggers.

### Enable
{ hooks: { enabled: true, token: "shared-secret", path: "/hooks" } }

### Endpoints
- POST /hooks/wake: { "text": "System line", "mode": "now" } — Enqueues system event for main session.
- POST /hooks/agent: { "message": "Run this", "name": "Email", ... } — Runs isolated agent turn.
- POST /hooks/<name> (mapped): Custom hook names resolved via hooks.mappings.

Auth: Every request must include the hook token via Authorization: Bearer <token> header.

## Security
Default: tools run on the host for the main session. Group/channel safety: set agents.defaults.sandbox.mode: "non-main" to sandbox non-main sessions. DM pairing (dmPolicy="pairing") is default: unknown senders receive a pairing code. Run "openclaw doctor" to surface risky/misconfigured DM policies.

## Workspace & Skills
- Workspace root: ~/.openclaw/workspace
- Injected prompt files: AGENTS.md, SOUL.md, TOOLS.md, MEMORY.md
- Skills: ~/.openclaw/workspace/skills/<skill>/SKILL.md

## Apps (Optional)
- **macOS app**: Menu bar control, Voice Wake + PTT, WebChat + debug tools.
- **iOS node**: Canvas, Voice Wake, Talk Mode, camera, Bonjour pairing.
- **Android node**: Canvas, Talk Mode, camera, screen recording, optional SMS.

## Voice
- Voice Wake: Always-on speech for macOS/iOS/Android with ElevenLabs.
- Talk Mode: Continuous conversation overlay.

## Chat Commands
Send in WhatsApp/Telegram/Slack/etc:
- /status — session status
- /new or /reset — reset session
- /compact — compact session context
- /think <level> — thinking level (off|minimal|low|medium|high|xhigh)
- /verbose on|off
- /usage off|tokens|full
- /restart — restart gateway
- /activation mention|always — group activation toggle

## Key Links
- Website: https://openclaw.ai
- Docs: https://docs.openclaw.ai
- Discord: https://discord.gg/clawd
- GitHub: https://github.com/openclaw/openclaw
- ClawHub (Skills): https://clawhub.com
- DeepWiki: https://deepwiki.com/openclaw/openclaw
`;

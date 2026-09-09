import type { AgentHarness, AgentHarnessId } from "../types.js";
import { AntigravityHarness } from "./antigravity.js";
import { ClaudeCodeHarness } from "./claude.js";
import { CursorHarness } from "./cursor.js";
import { WindsurfHarness } from "./windsurf.js";
import { ClaudeDesktopHarness } from "./desktop.js";
import { ZedHarness } from "./zed.js";
import { WorkspaceHarness } from "./workspace.js";
import { HermesHarness } from "./hermes.js";
import { OpenClawHarness } from "./openclaw.js";
import { DeepSeekHarness } from "./deepseek.js";
import { PiHarness } from "./pi.js";
import { DevinHarness } from "./devin.js";
import { ClineHarness } from "./cline.js";
import { RooCodeHarness } from "./roo.js";
import { ContinueHarness } from "./continue.js";
import { GooseHarness } from "./goose.js";
import { OpenHandsHarness } from "./openhands.js";
import { TraeHarness } from "./trae.js";
import { QwenCodeHarness } from "./qwen.js";

export * from "./base.js";
export * from "./antigravity.js";
export * from "./claude.js";
export * from "./cursor.js";
export * from "./windsurf.js";
export * from "./desktop.js";
export * from "./zed.js";
export * from "./workspace.js";
export * from "./hermes.js";
export * from "./openclaw.js";
export * from "./deepseek.js";
export * from "./pi.js";
export * from "./devin.js";
export * from "./cline.js";
export * from "./roo.js";
export * from "./continue.js";
export * from "./goose.js";
export * from "./openhands.js";
export * from "./trae.js";
export * from "./qwen.js";

export function getAllHarnesses(): AgentHarness[] {
  return [
    new AntigravityHarness(),
    new ClaudeCodeHarness(),
    new CursorHarness(),
    new WindsurfHarness(),
    new ClaudeDesktopHarness(),
    new ZedHarness(),
    new WorkspaceHarness(),
    new HermesHarness(),
    new OpenClawHarness(),
    new DeepSeekHarness(),
    new PiHarness(),
    new DevinHarness(),
    new ClineHarness(),
    new RooCodeHarness(),
    new ContinueHarness(),
    new GooseHarness(),
    new OpenHandsHarness(),
    new TraeHarness(),
    new QwenCodeHarness()
  ];
}

const ALIASES: Record<string, AgentHarnessId> = {
  gemini: "antigravity",
  antigravity: "antigravity",
  claude: "claude",
  "claude-code": "claude",
  cursor: "cursor",
  windsurf: "windsurf",
  desktop: "desktop",
  "claude-desktop": "desktop",
  zed: "zed",
  workspace: "workspace",
  local: "workspace",
  project: "workspace",
  hermes: "hermes",
  "hermes-agent": "hermes",
  openclaw: "openclaw",
  nanoclaw: "openclaw",
  clawdbot: "openclaw",
  moltbot: "openclaw",
  deepseek: "deepseek",
  pi: "pi",
  devin: "devin",
  cline: "cline",
  roo: "roo",
  "roo-code": "roo",
  roocode: "roo",
  continue: "continue",
  "continue-dev": "continue",
  goose: "goose",
  openhands: "openhands",
  trae: "trae",
  qwen: "qwen",
  "qwen-code": "qwen"
};

export function resolveHarnessId(rawName: string): AgentHarnessId | null {
  const normalized = rawName.trim().toLowerCase();
  return ALIASES[normalized] || null;
}

export function getHarnessById(id: string): AgentHarness | null {
  const resolved = resolveHarnessId(id);
  if (!resolved) return null;
  const list = getAllHarnesses();
  return list.find((h) => h.id === resolved) || null;
}

export async function detectHarnesses(): Promise<Array<{ harness: AgentHarness; detected: boolean }>> {
  const harnesses = getAllHarnesses();
  const results = await Promise.all(
    harnesses.map(async (harness) => {
      const detected = await harness.detect();
      return { harness, detected };
    })
  );
  return results;
}

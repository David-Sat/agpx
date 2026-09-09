import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { getHomeDir } from "../utils/paths.js";
import { dirExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class OpenClawHarness extends BaseHarness {
  readonly id: AgentHarnessId = "openclaw";
  readonly name = "OpenClaw";

  private async getActiveDir(): Promise<string> {
    const home = getHomeDir();
    const candidates = [
      path.join(home, ".openclaw"),
      path.join(home, ".nanoclaw"),
      path.join(home, ".clawdbot"),
      path.join(home, ".moltbot")
    ];
    for (const dir of candidates) {
      if (await dirExists(dir)) return dir;
    }
    return candidates[0];
  }

  async detect(): Promise<boolean> {
    const home = getHomeDir();
    const candidates = [
      path.join(home, ".openclaw"),
      path.join(home, ".nanoclaw"),
      path.join(home, ".clawdbot"),
      path.join(home, ".moltbot"),
      path.join(process.cwd(), ".openclaw"),
      path.join(process.cwd(), ".nanoclaw")
    ];
    for (const dir of candidates) {
      if (await dirExists(dir)) return true;
    }
    return false;
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".openclaw", "mcp.json");
    }
    return path.join(getHomeDir(), ".openclaw", "mcp.json");
  }

  getSkillsTargetDir(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".openclaw", "skills");
    }
    return path.join(getHomeDir(), ".openclaw", "skills");
  }
}

import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { getHomeDir } from "../utils/paths.js";
import { dirExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class AntigravityHarness extends BaseHarness {
  readonly id: AgentHarnessId = "antigravity";
  readonly name = "Google Antigravity";

  async detect(): Promise<boolean> {
    const geminiDir = path.join(getHomeDir(), ".gemini");
    return dirExists(geminiDir);
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    return path.join(getHomeDir(), ".gemini", "config", "mcp_config.json");
  }

  getSkillsTargetDir(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    return path.join(getHomeDir(), ".gemini", "config", "plugins");
  }
}

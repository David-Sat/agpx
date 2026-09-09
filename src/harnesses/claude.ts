import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { getHomeDir } from "../utils/paths.js";
import { dirExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class ClaudeCodeHarness extends BaseHarness {
  readonly id: AgentHarnessId = "claude";
  readonly name = "Claude Code";

  async detect(): Promise<boolean> {
    const claudeDir = path.join(getHomeDir(), ".claude");
    return dirExists(claudeDir);
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    return path.join(getHomeDir(), ".claude", "mcp.json");
  }

  getSkillsTargetDir(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    return path.join(getHomeDir(), ".claude", "skills");
  }
}

import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { getClaudeDesktopConfigPath } from "../utils/paths.js";
import { dirExists, fileExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class ClaudeDesktopHarness extends BaseHarness {
  readonly id: AgentHarnessId = "desktop";
  readonly name = "Claude Desktop";

  async detect(): Promise<boolean> {
    const configPath = getClaudeDesktopConfigPath();
    const dir = path.dirname(configPath);
    return (await fileExists(configPath)) || (await dirExists(dir));
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    return getClaudeDesktopConfigPath();
  }

  getSkillsTargetDir(): string | null {
    return null; // Claude Desktop does not support skills
  }
}

import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { getHomeDir } from "../utils/paths.js";
import { dirExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class DeepSeekHarness extends BaseHarness {
  readonly id: AgentHarnessId = "deepseek";
  readonly name = "DeepSeek";

  async detect(): Promise<boolean> {
    const globalDir = path.join(getHomeDir(), ".deepseek");
    const localDir = path.join(process.cwd(), ".deepseek");
    return (await dirExists(globalDir)) || (await dirExists(localDir));
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".deepseek", "mcp.json");
    }
    return path.join(getHomeDir(), ".deepseek", "mcp.json");
  }

  getSkillsTargetDir(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".deepseek", "skills");
    }
    return path.join(getHomeDir(), ".deepseek", "skills");
  }
}

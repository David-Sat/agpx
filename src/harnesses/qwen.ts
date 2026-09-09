import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { getHomeDir } from "../utils/paths.js";
import { dirExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class QwenCodeHarness extends BaseHarness {
  readonly id: AgentHarnessId = "qwen";
  readonly name = "Qwen Code";

  async detect(): Promise<boolean> {
    const globalDir = path.join(getHomeDir(), ".qwen");
    const localDir = path.join(process.cwd(), ".qwen");
    return (await dirExists(globalDir)) || (await dirExists(localDir));
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".qwen", "mcp.json");
    }
    return path.join(getHomeDir(), ".qwen", "mcp.json");
  }

  getSkillsTargetDir(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".qwen", "skills");
    }
    return path.join(getHomeDir(), ".qwen", "skills");
  }
}

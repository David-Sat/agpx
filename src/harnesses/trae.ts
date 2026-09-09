import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { getHomeDir } from "../utils/paths.js";
import { dirExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class TraeHarness extends BaseHarness {
  readonly id: AgentHarnessId = "trae";
  readonly name = "Trae";

  async detect(): Promise<boolean> {
    const globalDir = path.join(getHomeDir(), ".trae");
    const localDir = path.join(process.cwd(), ".trae");
    return (await dirExists(globalDir)) || (await dirExists(localDir));
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".trae", "mcp.json");
    }
    return path.join(getHomeDir(), ".trae", "mcp.json");
  }

  getSkillsTargetDir(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".trae", "skills");
    }
    return path.join(getHomeDir(), ".trae", "skills");
  }
}

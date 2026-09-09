import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { getHomeDir } from "../utils/paths.js";
import { dirExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class OpenHandsHarness extends BaseHarness {
  readonly id: AgentHarnessId = "openhands";
  readonly name = "OpenHands";

  async detect(): Promise<boolean> {
    const globalDir = path.join(getHomeDir(), ".openhands");
    const localDir = path.join(process.cwd(), ".openhands");
    return (await dirExists(globalDir)) || (await dirExists(localDir));
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".openhands", "mcp.json");
    }
    return path.join(getHomeDir(), ".openhands", "mcp.json");
  }

  getSkillsTargetDir(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".openhands", "skills");
    }
    return path.join(getHomeDir(), ".openhands", "skills");
  }
}

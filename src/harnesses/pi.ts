import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { getHomeDir } from "../utils/paths.js";
import { dirExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class PiHarness extends BaseHarness {
  readonly id: AgentHarnessId = "pi";
  readonly name = "Pi";

  async detect(): Promise<boolean> {
    const home = getHomeDir();
    const globalAgent = path.join(home, ".pi", "agent");
    const globalDir = path.join(home, ".pi");
    const localDir = path.join(process.cwd(), ".pi");
    return (await dirExists(globalAgent)) || (await dirExists(globalDir)) || (await dirExists(localDir));
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".pi", "mcp.json");
    }
    return path.join(getHomeDir(), ".pi", "agent", "mcp.json");
  }

  getSkillsTargetDir(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".pi", "skills");
    }
    return path.join(getHomeDir(), ".pi", "agent", "skills");
  }
}

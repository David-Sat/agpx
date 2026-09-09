import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { getHomeDir } from "../utils/paths.js";
import { dirExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class ContinueHarness extends BaseHarness {
  readonly id: AgentHarnessId = "continue";
  readonly name = "Continue";

  async detect(): Promise<boolean> {
    const globalDir = path.join(getHomeDir(), ".continue");
    const localDir = path.join(process.cwd(), ".continue");
    return (await dirExists(globalDir)) || (await dirExists(localDir));
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".continue", "config.json");
    }
    return path.join(getHomeDir(), ".continue", "config.json");
  }

  getSkillsTargetDir(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".continue", "skills");
    }
    return path.join(getHomeDir(), ".continue", "skills");
  }
}

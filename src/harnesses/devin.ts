import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { getHomeDir } from "../utils/paths.js";
import { dirExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class DevinHarness extends BaseHarness {
  readonly id: AgentHarnessId = "devin";
  readonly name = "Devin";

  private getGlobalConfigDir(): string {
    return path.join(getHomeDir(), ".config", "devin");
  }

  async detect(): Promise<boolean> {
    const home = getHomeDir();
    const configDir = this.getGlobalConfigDir();
    const dotDevin = path.join(home, ".devin");
    const localDir = path.join(process.cwd(), ".devin");
    return (await dirExists(configDir)) || (await dirExists(dotDevin)) || (await dirExists(localDir));
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".devin", "mcp.json");
    }
    return path.join(this.getGlobalConfigDir(), "mcp.json");
  }

  getSkillsTargetDir(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".devin", "skills");
    }
    return path.join(this.getGlobalConfigDir(), "skills");
  }
}

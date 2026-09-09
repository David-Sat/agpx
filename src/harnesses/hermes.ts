import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { getHomeDir } from "../utils/paths.js";
import { dirExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class HermesHarness extends BaseHarness {
  readonly id: AgentHarnessId = "hermes";
  readonly name = "Hermes Agent";

  private getBaseDir(): string {
    return process.env.HERMES_HOME?.trim() || path.join(getHomeDir(), ".hermes");
  }

  async detect(): Promise<boolean> {
    const base = this.getBaseDir();
    const local = path.join(process.cwd(), ".hermes");
    return (await dirExists(base)) || (await dirExists(local));
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".hermes", "mcp.json");
    }
    return path.join(this.getBaseDir(), "mcp.json");
  }

  getSkillsTargetDir(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".hermes", "skills");
    }
    return path.join(this.getBaseDir(), "skills");
  }
}

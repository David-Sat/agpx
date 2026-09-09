import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { getHomeDir } from "../utils/paths.js";
import { dirExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class GooseHarness extends BaseHarness {
  readonly id: AgentHarnessId = "goose";
  readonly name = "Goose";

  private getConfigDir(): string {
    return path.join(getHomeDir(), ".config", "goose");
  }

  async detect(): Promise<boolean> {
    const home = getHomeDir();
    const configDir = this.getConfigDir();
    const dotGoose = path.join(home, ".goose");
    const localDir = path.join(process.cwd(), ".goose");
    return (await dirExists(configDir)) || (await dirExists(dotGoose)) || (await dirExists(localDir));
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".goose", "mcp.json");
    }
    return path.join(this.getConfigDir(), "mcp.json");
  }

  getSkillsTargetDir(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".goose", "skills");
    }
    return path.join(getHomeDir(), ".goose", "skills");
  }
}

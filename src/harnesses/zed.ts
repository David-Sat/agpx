import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { getZedConfigDir } from "../utils/paths.js";
import { dirExists, fileExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class ZedHarness extends BaseHarness {
  readonly id: AgentHarnessId = "zed";
  readonly name = "Zed";

  protected override getMcpKey(): string {
    return "context_servers";
  }

  async detect(): Promise<boolean> {
    const configDir = getZedConfigDir();
    return (await dirExists(configDir)) || (await fileExists(path.join(configDir, "settings.json")));
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    return path.join(getZedConfigDir(), "settings.json");
  }

  getSkillsTargetDir(): string | null {
    return null; // Zed context_servers only
  }
}

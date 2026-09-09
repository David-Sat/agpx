import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { getHomeDir } from "../utils/paths.js";
import { dirExists, fileExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class ClineHarness extends BaseHarness {
  readonly id: AgentHarnessId = "cline";
  readonly name = "Cline";

  private getStorageDir(): string {
    const platform = process.platform;
    const home = getHomeDir();
    if (platform === "darwin") {
      return path.join(
        home,
        "Library",
        "Application Support",
        "Code",
        "User",
        "globalStorage",
        "saoudrizwan.claude-dev",
        "settings"
      );
    }
    if (platform === "win32") {
      const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
      return path.join(
        appData,
        "Code",
        "User",
        "globalStorage",
        "saoudrizwan.claude-dev",
        "settings"
      );
    }
    return path.join(
      home,
      ".config",
      "Code",
      "User",
      "globalStorage",
      "saoudrizwan.claude-dev",
      "settings"
    );
  }

  async detect(): Promise<boolean> {
    const storage = this.getStorageDir();
    const dotCline = path.join(getHomeDir(), ".cline");
    const localCline = path.join(process.cwd(), ".cline");
    return (await dirExists(storage)) || (await dirExists(dotCline)) || (await dirExists(localCline));
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".cline", "mcp.json");
    }
    return path.join(this.getStorageDir(), "cline_mcp_settings.json");
  }

  getSkillsTargetDir(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".clinerules");
    }
    return path.join(getHomeDir(), ".cline", "skills");
  }
}

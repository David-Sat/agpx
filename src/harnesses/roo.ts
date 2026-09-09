import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { getHomeDir } from "../utils/paths.js";
import { dirExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class RooCodeHarness extends BaseHarness {
  readonly id: AgentHarnessId = "roo";
  readonly name = "Roo Code";

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
        "rooveterinaryinc.roo-cline",
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
        "rooveterinaryinc.roo-cline",
        "settings"
      );
    }
    return path.join(
      home,
      ".config",
      "Code",
      "User",
      "globalStorage",
      "rooveterinaryinc.roo-cline",
      "settings"
    );
  }

  async detect(): Promise<boolean> {
    const storage = this.getStorageDir();
    const dotRoo = path.join(getHomeDir(), ".roo");
    const localRoo = path.join(process.cwd(), ".roo");
    return (await dirExists(storage)) || (await dirExists(dotRoo)) || (await dirExists(localRoo));
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".roo", "mcp.json");
    }
    return path.join(this.getStorageDir(), "cline_mcp_settings.json");
  }

  getSkillsTargetDir(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".roo", "rules");
    }
    return path.join(getHomeDir(), ".roo", "skills");
  }
}

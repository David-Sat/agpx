import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { getHomeDir } from "../utils/paths.js";
import { dirExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class CursorHarness extends BaseHarness {
  readonly id: AgentHarnessId = "cursor";
  readonly name = "Cursor";

  async detect(): Promise<boolean> {
    const globalCursor = path.join(getHomeDir(), ".cursor");
    const localCursor = path.join(process.cwd(), ".cursor");
    return (await dirExists(globalCursor)) || (await dirExists(localCursor));
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".cursor", "mcp.json");
    }
    return path.join(getHomeDir(), ".cursor", "mcp.json");
  }

  getSkillsTargetDir(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    if (options?.projectMode) {
      return path.join(process.cwd(), ".cursor", "rules");
    }
    return path.join(getHomeDir(), ".cursor", "skills");
  }
}

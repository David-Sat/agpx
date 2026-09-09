import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { getHomeDir } from "../utils/paths.js";
import { dirExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class WindsurfHarness extends BaseHarness {
  readonly id: AgentHarnessId = "windsurf";
  readonly name = "Windsurf";

  async detect(): Promise<boolean> {
    const windsurfDir = path.join(getHomeDir(), ".codeium", "windsurf");
    return dirExists(windsurfDir);
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    return path.join(getHomeDir(), ".codeium", "windsurf", "mcp_config.json");
  }

  getSkillsTargetDir(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    return path.join(getHomeDir(), ".codeium", "windsurf", "skills");
  }
}

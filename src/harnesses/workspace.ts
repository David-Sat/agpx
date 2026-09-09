import path from "node:path";
import type { AgentHarnessId, HarnessInstallOptions } from "../types.js";
import { fileExists } from "../core/discover.js";
import { BaseHarness } from "./base.js";

export class WorkspaceHarness extends BaseHarness {
  readonly id: AgentHarnessId = "workspace";
  readonly name = "Workspace (In-Repo)";

  async detect(): Promise<boolean> {
    return true;
  }

  getMcpConfigPath(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    const cwd = process.cwd();
    return path.join(cwd, ".mcp.json");
  }

  getSkillsTargetDir(options?: HarnessInstallOptions): string | null {
    if (options?.customPath) return options.customPath;
    const cwd = process.cwd();
    return path.join(cwd, "skills");
  }
}

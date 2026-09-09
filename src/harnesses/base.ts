import fs from "node:fs/promises";
import path from "node:path";
import type {
  AgentHarness,
  AgentHarnessId,
  DiscoveredSkill,
  HarnessInstallOptions,
  McpServerConfig
} from "../types.js";
import { mergeMcpServers, removeMcpServers } from "../utils/json-merge.js";

export abstract class BaseHarness implements AgentHarness {
  abstract readonly id: AgentHarnessId;
  abstract readonly name: string;

  abstract detect(): Promise<boolean>;
  abstract getMcpConfigPath(options?: HarnessInstallOptions): string | null;
  abstract getSkillsTargetDir(options?: HarnessInstallOptions): string | null;

  protected getMcpKey(): string {
    return "mcpServers";
  }

  async installMcp(
    servers: Record<string, McpServerConfig>,
    options: HarnessInstallOptions = {}
  ): Promise<string> {
    const configPath = this.getMcpConfigPath(options);
    if (!configPath) {
      throw new Error(`Harness ${this.name} does not have an MCP configuration path`);
    }

    await mergeMcpServers(configPath, servers, {
      key: this.getMcpKey(),
      dryRun: options.dryRun
    });

    return configPath;
  }

  async installSkills(
    skills: DiscoveredSkill[],
    options: HarnessInstallOptions = {}
  ): Promise<string[]> {
    const skillsTarget = this.getSkillsTargetDir(options);
    if (!skillsTarget) {
      return [];
    }

    const installedPaths: string[] = [];

    for (const skill of skills) {
      const destSkillDir = path.join(skillsTarget, skill.name);
      installedPaths.push(destSkillDir);

      if (!options.dryRun) {
        await fs.mkdir(destSkillDir, { recursive: true });
        await fs.cp(skill.dirPath, destSkillDir, { recursive: true });
      }
    }

    return installedPaths;
  }

  async remove(
    _pluginName: string,
    serverKeys: string[],
    skillNames: string[],
    options: HarnessInstallOptions = {}
  ): Promise<{ mcpModified: boolean; removedSkills: string[] }> {
    let mcpModified = false;
    const configPath = this.getMcpConfigPath(options);

    if (configPath && serverKeys.length > 0) {
      const res = await removeMcpServers(configPath, serverKeys, {
        key: this.getMcpKey(),
        dryRun: options.dryRun
      });
      mcpModified = res.removedKeys.length > 0;
    }

    const removedSkills: string[] = [];
    const skillsTarget = this.getSkillsTargetDir(options);

    if (skillsTarget && skillNames.length > 0) {
      for (const name of skillNames) {
        const destSkillDir = path.join(skillsTarget, name);
        try {
          const stat = await fs.stat(destSkillDir);
          if (stat.isDirectory()) {
            if (!options.dryRun) {
              await fs.rm(destSkillDir, { recursive: true, force: true });
            }
            removedSkills.push(name);
          }
        } catch {
          // Ignore if directory doesn't exist
        }
      }
    }

    return { mcpModified, removedSkills };
  }
}

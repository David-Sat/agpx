import fs from "node:fs/promises";
import path from "node:path";
import type {
  DiscoveredPlugin,
  DiscoveredSkill,
  McpConfig,
  McpServerConfig,
  PluginManifest
} from "../types.js";
import { readJsonFile } from "../utils/json-merge.js";

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

export async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export async function discoverSkills(rootDir: string): Promise<DiscoveredSkill[]> {
  const discovered: DiscoveredSkill[] = [];
  const candidateDirs = [
    path.join(rootDir, "skills"),
    path.join(rootDir, ".claude-plugin", "skills")
  ];

  for (const skillsRoot of candidateDirs) {
    if (await dirExists(skillsRoot)) {
      const entries = await fs.readdir(skillsRoot, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillDir = path.join(skillsRoot, entry.name);
          const skillFile = path.join(skillDir, "SKILL.md");
          if (await fileExists(skillFile)) {
            // Read first non-empty comment/frontmatter or header for description
            let description: string | undefined;
            try {
              const raw = await fs.readFile(skillFile, "utf-8");
              const lines = raw.split("\n");
              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith("description:")) {
                  description = trimmed.replace(/^description:\s*/, "").replace(/^["']|["']$/g, "");
                  break;
                } else if (trimmed.startsWith("# ") && !description) {
                  description = trimmed.replace(/^#\s*/, "");
                }
              }
            } catch {
              // Ignore read failure
            }

            discovered.push({
              name: entry.name,
              dirPath: skillDir,
              skillFilePath: skillFile,
              description
            });
          }
        }
      }
    }
  }

  // Also check if root itself has a SKILL.md
  const rootSkillFile = path.join(rootDir, "SKILL.md");
  if (discovered.length === 0 && (await fileExists(rootSkillFile))) {
    discovered.push({
      name: path.basename(rootDir),
      dirPath: rootDir,
      skillFilePath: rootSkillFile
    });
  }

  return discovered;
}

export async function discoverMcpServers(
  rootDir: string,
  manifest?: PluginManifest
): Promise<Record<string, McpServerConfig>> {
  // 1. If manifest specifies mcpConfig file
  if (manifest?.mcpConfig) {
    const customPath = path.resolve(rootDir, manifest.mcpConfig);
    if (await fileExists(customPath)) {
      const { data } = await readJsonFile<McpConfig>(customPath);
      if (data?.mcpServers) return data.mcpServers;
    }
  }

  // 2. Standard mcp_config.json
  const standardMcpPath = path.join(rootDir, "mcp_config.json");
  if (await fileExists(standardMcpPath)) {
    const { data } = await readJsonFile<McpConfig>(standardMcpPath);
    if (data?.mcpServers) return data.mcpServers;
  }

  // 3. .claude-plugin/plugin.json (may have mcpServers embedded)
  const claudePluginPath = path.join(rootDir, ".claude-plugin", "plugin.json");
  if (await fileExists(claudePluginPath)) {
    const { data } = await readJsonFile<{ mcpServers?: Record<string, McpServerConfig> }>(claudePluginPath);
    if (data?.mcpServers) return data.mcpServers;
  }

  // 4. .mcp.json or mcp.json fallback
  const dotMcpPath = path.join(rootDir, ".mcp.json");
  if (await fileExists(dotMcpPath)) {
    const { data } = await readJsonFile<McpConfig>(dotMcpPath);
    if (data?.mcpServers) return data.mcpServers;
  }

  const rootMcpJson = path.join(rootDir, "mcp.json");
  if (await fileExists(rootMcpJson)) {
    const { data } = await readJsonFile<McpConfig>(rootMcpJson);
    if (data?.mcpServers) return data.mcpServers;
  }

  return {};
}

export async function discoverPlugin(rootDir: string): Promise<DiscoveredPlugin> {
  const dirStat = await fs.stat(rootDir).catch(() => null);
  if (!dirStat || !dirStat.isDirectory()) {
    throw new Error(`Target path does not exist or is not a directory: ${rootDir}`);
  }

  let manifest: PluginManifest = {
    name: path.basename(rootDir),
    version: "1.0.0",
    description: ""
  };

  // 1. Primary: plugin.json in root
  const primaryManifestPath = path.join(rootDir, "plugin.json");
  if (await fileExists(primaryManifestPath)) {
    const { data } = await readJsonFile<PluginManifest>(primaryManifestPath);
    manifest = { ...manifest, ...data };
  } else {
    // 2. Fallback: .claude-plugin/plugin.json
    const claudeManifestPath = path.join(rootDir, ".claude-plugin", "plugin.json");
    if (await fileExists(claudeManifestPath)) {
      const { data } = await readJsonFile<PluginManifest>(claudeManifestPath);
      manifest = { ...manifest, ...data };
    }
  }

  const mcpServers = await discoverMcpServers(rootDir, manifest);
  const skills = await discoverSkills(rootDir);

  return {
    name: manifest.name || path.basename(rootDir),
    version: manifest.version || "1.0.0",
    description: manifest.description || "",
    rootDir,
    manifest,
    mcpServers,
    skills,
    environmentVariables: manifest.environmentVariables || {}
  };
}

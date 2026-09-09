import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { discoverPlugin, discoverSkills, discoverMcpServers } from "../src/core/discover.js";

describe("Plugin Discovery Protocol", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "agp-test-discover-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("should discover standard plugin.json + mcp_config.json + skills", async () => {
    // 1. Create plugin.json
    const manifest = {
      $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
      name: "lux-edit",
      version: "0.7.0",
      description: "Live in-browser visual editing overlay and MCP review tools",
      environmentVariables: {
        LUX_PORT: {
          description: "Custom proxy port",
          required: false,
          default: "4320"
        }
      }
    };
    await fs.writeFile(path.join(tmpDir, "plugin.json"), JSON.stringify(manifest), "utf-8");

    // 2. Create mcp_config.json
    const mcpConfig = {
      mcpServers: {
        lux: {
          command: "npx",
          args: ["-y", "lux-edit", "mcp"]
        }
      }
    };
    await fs.writeFile(path.join(tmpDir, "mcp_config.json"), JSON.stringify(mcpConfig), "utf-8");

    // 3. Create skills/lux/SKILL.md
    const skillDir = path.join(tmpDir, "skills", "lux");
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(
      path.join(skillDir, "SKILL.md"),
      `---\nname: lux\ndescription: Visual editing overlay\n---\n# Lux Skill\nInstructions here.`,
      "utf-8"
    );

    const plugin = await discoverPlugin(tmpDir);

    expect(plugin.name).toBe("lux-edit");
    expect(plugin.version).toBe("0.7.0");
    expect(plugin.description).toBe("Live in-browser visual editing overlay and MCP review tools");
    expect(plugin.mcpServers.lux).toBeDefined();
    expect(plugin.mcpServers.lux.command).toBe("npx");
    expect(plugin.skills).toHaveLength(1);
    expect(plugin.skills[0].name).toBe("lux");
    expect(plugin.skills[0].description).toBe("Visual editing overlay");
    expect(plugin.environmentVariables.LUX_PORT).toBeDefined();
  });

  it("should discover fallback .claude-plugin/plugin.json", async () => {
    const claudeDir = path.join(tmpDir, ".claude-plugin");
    await fs.mkdir(claudeDir, { recursive: true });

    const claudeManifest = {
      name: "claude-toolset",
      version: "1.2.0",
      description: "Claude plugin toolset",
      mcpServers: {
        helper: {
          command: "node",
          args: ["helper.js"]
        }
      }
    };
    await fs.writeFile(path.join(claudeDir, "plugin.json"), JSON.stringify(claudeManifest), "utf-8");

    const plugin = await discoverPlugin(tmpDir);
    expect(plugin.name).toBe("claude-toolset");
    expect(plugin.version).toBe("1.2.0");
    expect(plugin.mcpServers.helper).toBeDefined();
  });

  it("should discover fallback .mcp.json or mcp.json", async () => {
    await fs.writeFile(
      path.join(tmpDir, ".mcp.json"),
      JSON.stringify({
        mcpServers: {
          rawServer: { command: "python", args: ["server.py"] }
        }
      }),
      "utf-8"
    );

    const servers = await discoverMcpServers(tmpDir);
    expect(servers.rawServer).toBeDefined();
    expect(servers.rawServer.command).toBe("python");
  });
});

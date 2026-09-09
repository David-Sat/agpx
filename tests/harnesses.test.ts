import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { getAllHarnesses, getHarnessById } from "../src/harnesses/index.js";
import { WorkspaceHarness } from "../src/harnesses/workspace.js";
import { readJsonFile } from "../src/utils/json-merge.js";

describe("Agent Harnesses", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "agp-test-harnesses-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("should have all required harnesses registered", () => {
    const harnesses = getAllHarnesses();
    const ids = harnesses.map((h) => h.id);
    const expected = [
      "antigravity",
      "claude",
      "cursor",
      "windsurf",
      "desktop",
      "zed",
      "workspace",
      "hermes",
      "openclaw",
      "deepseek",
      "pi",
      "devin",
      "cline",
      "roo",
      "continue",
      "goose",
      "openhands",
      "trae",
      "qwen"
    ];
    for (const exp of expected) {
      expect(ids).toContain(exp);
    }
  });

  it("should resolve harnesses by id and aliases", () => {
    expect(getHarnessById("gemini")?.id).toBe("antigravity");
    expect(getHarnessById("claude-code")?.id).toBe("claude");
    expect(getHarnessById("cursor")?.id).toBe("cursor");
    expect(getHarnessById("windsurf")?.id).toBe("windsurf");
    expect(getHarnessById("desktop")?.id).toBe("desktop");
    expect(getHarnessById("zed")?.id).toBe("zed");
    expect(getHarnessById("workspace")?.id).toBe("workspace");
    expect(getHarnessById("hermes")?.id).toBe("hermes");
    expect(getHarnessById("hermes-agent")?.id).toBe("hermes");
    expect(getHarnessById("openclaw")?.id).toBe("openclaw");
    expect(getHarnessById("nanoclaw")?.id).toBe("openclaw");
    expect(getHarnessById("clawdbot")?.id).toBe("openclaw");
    expect(getHarnessById("deepseek")?.id).toBe("deepseek");
    expect(getHarnessById("pi")?.id).toBe("pi");
    expect(getHarnessById("devin")?.id).toBe("devin");
    expect(getHarnessById("cline")?.id).toBe("cline");
    expect(getHarnessById("roo")?.id).toBe("roo");
    expect(getHarnessById("roo-code")?.id).toBe("roo");
    expect(getHarnessById("continue")?.id).toBe("continue");
    expect(getHarnessById("continue-dev")?.id).toBe("continue");
    expect(getHarnessById("goose")?.id).toBe("goose");
    expect(getHarnessById("openhands")?.id).toBe("openhands");
    expect(getHarnessById("trae")?.id).toBe("trae");
    expect(getHarnessById("qwen")?.id).toBe("qwen");
    expect(getHarnessById("qwen-code")?.id).toBe("qwen");
  });

  it("should install MCP and skills into custom/workspace harness paths", async () => {
    const mcpCustomFile = path.join(tmpDir, ".mcp.json");
    const skillsCustomDir = path.join(tmpDir, "skills");

    // Mock source skill
    const sourceSkillDir = path.join(tmpDir, "source-skill");
    await fs.mkdir(sourceSkillDir, { recursive: true });
    await fs.writeFile(
      path.join(sourceSkillDir, "SKILL.md"),
      "# Mock Skill\nDo something",
      "utf-8"
    );

    const ws = new WorkspaceHarness();

    // 1. Install MCP
    await ws.installMcp(
      {
        sample: { command: "node", args: ["index.js"] }
      },
      { customPath: mcpCustomFile }
    );

    const { data } = await readJsonFile<any>(mcpCustomFile);
    expect(data.mcpServers.sample).toBeDefined();

    // 2. Install Skills
    await ws.installSkills(
      [
        {
          name: "sample-skill",
          dirPath: sourceSkillDir,
          skillFilePath: path.join(sourceSkillDir, "SKILL.md")
        }
      ],
      { customPath: skillsCustomDir }
    );

    const installedSkillStat = await fs.stat(
      path.join(skillsCustomDir, "sample-skill", "SKILL.md")
    );
    expect(installedSkillStat.isFile()).toBe(true);

    // 3. Remove
    const removeRes = await ws.remove(
      "sample-plugin",
      ["sample"],
      ["sample-skill"],
      { customPath: mcpCustomFile }
    );

    expect(removeRes.mcpModified).toBe(true);
    const updatedJson = await readJsonFile<any>(mcpCustomFile);
    expect(updatedJson.data.mcpServers.sample).toBeUndefined();
  });
});

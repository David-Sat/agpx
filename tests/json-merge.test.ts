import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { mergeMcpServers, removeMcpServers, readJsonFile } from "../src/utils/json-merge.js";

describe("JSON Merge Utility", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "agp-test-json-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("should create a new config file if it does not exist", async () => {
    const filePath = path.join(tmpDir, "mcp.json");
    const result = await mergeMcpServers(filePath, {
      lux: { command: "npx", args: ["-y", "lux-edit", "mcp"] }
    });

    expect(result.addedKeys).toEqual(["lux"]);
    expect(result.updatedKeys).toEqual([]);

    const { data } = await readJsonFile<{ mcpServers: Record<string, any> }>(filePath);
    expect(data.mcpServers.lux).toBeDefined();
    expect(data.mcpServers.lux.command).toBe("npx");
    expect(data.mcpServers.lux.args).toEqual(["-y", "lux-edit", "mcp"]);
  });

  it("should non-destructively merge into existing config preserving existing keys", async () => {
    const filePath = path.join(tmpDir, "mcp.json");
    const initial = {
      theme: "dark",
      mcpServers: {
        existingServer: {
          command: "node",
          args: ["server.js"]
        }
      }
    };
    await fs.writeFile(filePath, JSON.stringify(initial, null, 2), "utf-8");

    const result = await mergeMcpServers(filePath, {
      lux: { command: "npx", args: ["lux-edit"] }
    });

    expect(result.addedKeys).toEqual(["lux"]);
    const { data } = await readJsonFile<any>(filePath);
    expect(data.theme).toBe("dark");
    expect(data.mcpServers.existingServer).toBeDefined();
    expect(data.mcpServers.lux).toBeDefined();
  });

  it("should update existing server if key already exists", async () => {
    const filePath = path.join(tmpDir, "mcp.json");
    const initial = {
      mcpServers: {
        lux: { command: "npx", args: ["old-version"] }
      }
    };
    await fs.writeFile(filePath, JSON.stringify(initial, null, 2), "utf-8");

    const result = await mergeMcpServers(filePath, {
      lux: { command: "npx", args: ["new-version"] }
    });

    expect(result.addedKeys).toEqual([]);
    expect(result.updatedKeys).toEqual(["lux"]);

    const { data } = await readJsonFile<any>(filePath);
    expect(data.mcpServers.lux.args).toEqual(["new-version"]);
  });

  it("should support custom container keys such as Zed's context_servers", async () => {
    const filePath = path.join(tmpDir, "zed-settings.json");
    await mergeMcpServers(
      filePath,
      { myServer: { command: "python", args: ["main.py"] } },
      { key: "context_servers" }
    );

    const { data } = await readJsonFile<any>(filePath);
    expect(data.context_servers).toBeDefined();
    expect(data.context_servers.myServer.command).toBe("python");
    expect(data.mcpServers).toBeUndefined();
  });

  it("should cleanly remove specified keys without deleting other servers or user configs", async () => {
    const filePath = path.join(tmpDir, "mcp.json");
    const initial = {
      otherOption: 123,
      mcpServers: {
        serverA: { command: "a" },
        serverB: { command: "b" },
        serverC: { command: "c" }
      }
    };
    await fs.writeFile(filePath, JSON.stringify(initial, null, 2), "utf-8");

    const result = await removeMcpServers(filePath, ["serverB", "serverC"]);
    expect(result.removedKeys).toEqual(["serverB", "serverC"]);

    const { data } = await readJsonFile<any>(filePath);
    expect(data.otherOption).toBe(123);
    expect(data.mcpServers.serverA).toBeDefined();
    expect(data.mcpServers.serverB).toBeUndefined();
    expect(data.mcpServers.serverC).toBeUndefined();
  });

  it("should not write to disk in dryRun mode", async () => {
    const filePath = path.join(tmpDir, "dryrun.json");
    await mergeMcpServers(
      filePath,
      { test: { command: "test" } },
      { dryRun: true }
    );

    const { exists } = await readJsonFile(filePath);
    expect(exists).toBe(false);
  });
});

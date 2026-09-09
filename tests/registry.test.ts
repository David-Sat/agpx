import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  recordInstall,
  removeRecord,
  getInstalledPlugin,
  listInstalledPlugins
} from "../src/core/registry.js";
import type { InstalledPluginRecord } from "../src/types.js";

describe("Installed Plugins Registry", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "agp-test-reg-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("should record an installation in project mode", async () => {
    const record: InstalledPluginRecord = {
      name: "lux-edit",
      source: "David-Sat/lux-edit",
      version: "0.7.0",
      installedAt: new Date().toISOString(),
      agents: ["antigravity", "claude"],
      mcpServers: ["lux"],
      skills: ["lux"],
      env: ["LUX_PORT"],
      projectMode: true
    };

    await recordInstall(record, true, tmpDir);

    const fetched = await getInstalledPlugin("lux-edit", true, tmpDir);
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe("lux-edit");
    expect(fetched?.agents).toEqual(["antigravity", "claude"]);

    const list = await listInstalledPlugins(true, tmpDir);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("lux-edit");
  });

  it("should remove an installation cleanly", async () => {
    const record: InstalledPluginRecord = {
      name: "test-plugin",
      source: "test/plugin",
      version: "1.0.0",
      installedAt: new Date().toISOString(),
      agents: ["cursor"],
      mcpServers: ["test"],
      skills: [],
      env: [],
      projectMode: true
    };

    await recordInstall(record, true, tmpDir);
    const removed = await removeRecord("test-plugin", true, tmpDir);
    expect(removed).not.toBeNull();

    const fetched = await getInstalledPlugin("test-plugin", true, tmpDir);
    expect(fetched).toBeNull();
  });
});

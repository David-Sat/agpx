import fs from "node:fs/promises";
import path from "node:path";
import type { InstalledPluginRecord, RegistryData } from "../types.js";
import { getAgpGlobalRegistryPath, getAgpProjectRegistryPath } from "../utils/paths.js";
import { readJsonFile } from "../utils/json-merge.js";

const DEFAULT_REGISTRY: RegistryData = {
  version: "1.0.0",
  plugins: {}
};

export function getRegistryPath(projectMode?: boolean, cwd: string = process.cwd()): string {
  return projectMode ? getAgpProjectRegistryPath(cwd) : getAgpGlobalRegistryPath();
}

export async function loadRegistry(projectMode?: boolean, cwd?: string): Promise<RegistryData> {
  const regPath = getRegistryPath(projectMode, cwd);
  const { exists, data } = await readJsonFile<RegistryData>(regPath);
  if (!exists || !data || !data.plugins) {
    return { ...DEFAULT_REGISTRY, plugins: {} };
  }
  return data;
}

export async function saveRegistry(
  data: RegistryData,
  projectMode?: boolean,
  cwd?: string
): Promise<void> {
  const regPath = getRegistryPath(projectMode, cwd);
  await fs.mkdir(path.dirname(regPath), { recursive: true });
  await fs.writeFile(regPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export async function recordInstall(
  record: InstalledPluginRecord,
  projectMode?: boolean,
  cwd?: string
): Promise<void> {
  const registry = await loadRegistry(projectMode, cwd);
  registry.plugins[record.name] = record;
  await saveRegistry(registry, projectMode, cwd);
}

export async function removeRecord(
  pluginName: string,
  projectMode?: boolean,
  cwd?: string
): Promise<InstalledPluginRecord | null> {
  const registry = await loadRegistry(projectMode, cwd);
  const existing = registry.plugins[pluginName] || null;
  if (existing) {
    delete registry.plugins[pluginName];
    await saveRegistry(registry, projectMode, cwd);
  }
  return existing;
}

export async function getInstalledPlugin(
  pluginName: string,
  projectMode?: boolean,
  cwd?: string
): Promise<InstalledPluginRecord | null> {
  const registry = await loadRegistry(projectMode, cwd);
  return registry.plugins[pluginName] || null;
}

export async function listInstalledPlugins(
  projectMode?: boolean,
  cwd?: string
): Promise<InstalledPluginRecord[]> {
  const registry = await loadRegistry(projectMode, cwd);
  return Object.values(registry.plugins);
}

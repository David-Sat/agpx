import fs from "node:fs/promises";
import path from "node:path";
import type { McpServerConfig } from "../types.js";

export interface MergeJsonOptions {
  key?: string; // defaults to 'mcpServers', 'context_servers' for Zed
  dryRun?: boolean;
}

export interface MergeResult {
  filePath: string;
  previousContent: string | null;
  newContent: string;
  addedKeys: string[];
  updatedKeys: string[];
}

export interface RemoveResult {
  filePath: string;
  previousContent: string | null;
  newContent: string;
  removedKeys: string[];
}

export async function readJsonFile<T = Record<string, unknown>>(
  filePath: string
): Promise<{ exists: boolean; content: string; data: T }> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(content) as T;
    return { exists: true, content, data };
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { exists: false, content: "", data: {} as T };
    }
    throw new Error(`Failed to parse JSON file at ${filePath}: ${(err as Error).message}`);
  }
}

export async function mergeMcpServers(
  filePath: string,
  servers: Record<string, McpServerConfig>,
  options: MergeJsonOptions = {}
): Promise<MergeResult> {
  const containerKey = options.key ?? "mcpServers";
  const { exists, content: previousContent, data } = await readJsonFile<Record<string, unknown>>(filePath);

  const root = exists && typeof data === "object" && data !== null ? { ...data } : {};
  const currentServers = (root[containerKey] && typeof root[containerKey] === "object"
    ? { ...(root[containerKey] as Record<string, unknown>) }
    : {}) as Record<string, McpServerConfig>;

  const addedKeys: string[] = [];
  const updatedKeys: string[] = [];

  for (const [name, config] of Object.entries(servers)) {
    if (name in currentServers) {
      updatedKeys.push(name);
    } else {
      addedKeys.push(name);
    }
    currentServers[name] = config;
  }

  root[containerKey] = currentServers;
  const newContent = JSON.stringify(root, null, 2) + "\n";

  if (!options.dryRun) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, newContent, "utf-8");
  }

  return {
    filePath,
    previousContent: exists ? previousContent : null,
    newContent,
    addedKeys,
    updatedKeys
  };
}

export async function removeMcpServers(
  filePath: string,
  serverNames: string[],
  options: MergeJsonOptions = {}
): Promise<RemoveResult> {
  const containerKey = options.key ?? "mcpServers";
  const { exists, content: previousContent, data } = await readJsonFile<Record<string, unknown>>(filePath);

  if (!exists) {
    return {
      filePath,
      previousContent: null,
      newContent: "",
      removedKeys: []
    };
  }

  const root = typeof data === "object" && data !== null ? { ...data } : {};
  const currentServers = (root[containerKey] && typeof root[containerKey] === "object"
    ? { ...(root[containerKey] as Record<string, unknown>) }
    : {}) as Record<string, unknown>;

  const removedKeys: string[] = [];

  for (const name of serverNames) {
    if (name in currentServers) {
      delete currentServers[name];
      removedKeys.push(name);
    }
  }

  root[containerKey] = currentServers;
  const newContent = JSON.stringify(root, null, 2) + "\n";

  if (!options.dryRun && removedKeys.length > 0) {
    await fs.writeFile(filePath, newContent, "utf-8");
  }

  return {
    filePath,
    previousContent,
    newContent,
    removedKeys
  };
}

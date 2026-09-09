import * as p from "@clack/prompts";
import pc from "picocolors";
import type {
  AddCommandOptions,
  AgentHarness,
  AgentHarnessId,
  DiscoveredPlugin,
  InstalledPluginRecord,
  McpServerConfig
} from "../types.js";
import { resolvePluginSource } from "./git.js";
import { discoverPlugin } from "./discover.js";
import { detectHarnesses, getHarnessById } from "../harnesses/index.js";
import {
  confirmSecurityTrust,
  displayBanner,
  displayCompleted,
  displayPluginSummary,
  promptEnvVariables,
  selectTargetHarnesses
} from "../ui/prompts.js";
import {
  getInstalledPlugin,
  recordInstall,
  removeRecord
} from "./registry.js";

export interface InstallResult {
  plugin: DiscoveredPlugin;
  configuredAgents: string[];
  mcpServers: string[];
  skills: string[];
}

export async function installPlugin(
  source: string,
  options: AddCommandOptions = {}
): Promise<InstallResult> {
  const isNonInteractive = Boolean(options.yes || !process.stdout.isTTY);

  displayBanner();

  const spin = p.spinner();
  spin.start(`Resolving plugin from: ${source}`);

  let sourceDir: string;
  try {
    const res = await resolvePluginSource(source);
    sourceDir = res.sourceDir;
    spin.stop(pc.green(`Resolved source: ${source}`));
  } catch (err: unknown) {
    spin.stop(pc.red(`Failed to resolve source: ${(err as Error).message}`));
    throw err;
  }

  // Discover layout
  const plugin = await discoverPlugin(sourceDir);
  displayPluginSummary(plugin, source);

  // Security confirmation
  const trusted = await confirmSecurityTrust(plugin, isNonInteractive);
  if (!trusted) {
    p.cancel(pc.red("Aborted: Plugin was not trusted."));
    process.exit(1);
  }

  // Env variables handling
  const collectedEnv = await promptEnvVariables(
    plugin.environmentVariables,
    isNonInteractive
  );

  // Merge collected env vars into MCP servers
  const enrichedServers: Record<string, McpServerConfig> = {};
  for (const [name, server] of Object.entries(plugin.mcpServers)) {
    enrichedServers[name] = {
      ...server,
      env: {
        ...(server.env || {}),
        ...collectedEnv
      }
    };
  }

  // Harness resolution
  let targetHarnesses: AgentHarness[] = [];

  if (options.path) {
    // Custom target path: use Workspace harness targeting custom path
    const ws = getHarnessById("workspace");
    if (ws) {
      targetHarnesses = [ws];
    }
  } else if (options.project) {
    const ws = getHarnessById("workspace");
    if (ws) targetHarnesses = [ws];
  } else {
    const detectedList = await detectHarnesses();
    let preselected: string[] | undefined;

    if (options.agent && options.agent.length > 0) {
      preselected = options.agent.map((a) => a.trim().toLowerCase());
    }

    targetHarnesses = await selectTargetHarnesses(
      detectedList,
      preselected,
      isNonInteractive
    );
  }

  if (targetHarnesses.length === 0) {
    p.log.warn(pc.yellow("No agents selected."));
    return {
      plugin,
      configuredAgents: [],
      mcpServers: Object.keys(enrichedServers),
      skills: plugin.skills.map((s) => s.name)
    };
  }

  // Execute installation across harnesses
  const configuredAgentNames: string[] = [];
  const configuredAgentIds: AgentHarnessId[] = [];

  for (const harness of targetHarnesses) {
    const s = p.spinner();
    s.start(`Configuring ${harness.name}...`);

    try {
      if (Object.keys(enrichedServers).length > 0) {
        await harness.installMcp(enrichedServers, {
          projectMode: options.project,
          customPath: options.path,
          dryRun: options.dryRun
        });
      }

      if (plugin.skills.length > 0) {
        await harness.installSkills(plugin.skills, {
          projectMode: options.project,
          customPath: options.path,
          dryRun: options.dryRun
        });
      }

      s.stop(pc.green(`Configuring ${harness.name}... ✓`));
      configuredAgentNames.push(harness.name);
      configuredAgentIds.push(harness.id);
    } catch (err: unknown) {
      s.stop(pc.red(`Configuring ${harness.name}... ✗ (${(err as Error).message})`));
    }
  }

  // Record in registry
  if (!options.dryRun && configuredAgentIds.length > 0) {
    const record: InstalledPluginRecord = {
      name: plugin.name,
      source,
      version: plugin.version,
      installedAt: new Date().toISOString(),
      agents: configuredAgentIds,
      mcpServers: Object.keys(enrichedServers),
      skills: plugin.skills.map((s) => s.name),
      env: Object.keys(collectedEnv),
      projectMode: options.project
    };

    await recordInstall(record, options.project);
  }

  displayCompleted(plugin.name, configuredAgentNames, options.dryRun);

  return {
    plugin,
    configuredAgents: configuredAgentNames,
    mcpServers: Object.keys(enrichedServers),
    skills: plugin.skills.map((s) => s.name)
  };
}

export async function removePlugin(
  pluginName: string,
  options: { project?: boolean; dryRun?: boolean } = {}
): Promise<boolean> {
  const record = await getInstalledPlugin(pluginName, options.project);
  if (!record) {
    p.log.error(pc.red(`Plugin "${pluginName}" is not installed.`));
    return false;
  }

  displayBanner();
  p.log.info(`Removing plugin: ${pc.cyan(pluginName)}`);

  for (const agentId of record.agents) {
    const harness = getHarnessById(agentId);
    if (!harness) continue;

    const s = p.spinner();
    s.start(`Removing from ${harness.name}...`);
    try {
      await harness.remove(pluginName, record.mcpServers, record.skills, {
        projectMode: record.projectMode || options.project,
        dryRun: options.dryRun
      });
      s.stop(pc.green(`Removed from ${harness.name}... ✓`));
    } catch (err: unknown) {
      s.stop(pc.red(`Failed removing from ${harness.name}: ${(err as Error).message}`));
    }
  }

  if (!options.dryRun) {
    await removeRecord(pluginName, options.project);
  }

  p.outro(pc.green(`Removed ${pluginName}.`));
  return true;
}

export async function updatePlugin(
  pluginName: string,
  options: { project?: boolean; dryRun?: boolean; yes?: boolean } = {}
): Promise<boolean> {
  const record = await getInstalledPlugin(pluginName, options.project);
  if (!record) {
    p.log.error(pc.red(`Plugin "${pluginName}" is not installed.`));
    return false;
  }

  p.log.info(`Updating ${pc.cyan(pluginName)} from ${pc.bold(record.source)}...`);

  await installPlugin(record.source, {
    project: record.projectMode || options.project,
    agent: record.agents,
    yes: options.yes ?? true,
    dryRun: options.dryRun
  });

  return true;
}

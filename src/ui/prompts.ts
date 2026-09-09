import * as p from "@clack/prompts";
import pc from "picocolors";
import type { AgentHarness, DiscoveredPlugin, EnvVarDefinition } from "../types.js";

export function displayBanner(version: string = "1.0.0"): void {
  p.intro(pc.bgCyan(pc.black(` agpx v${version} `)));
}

export function displayPluginSummary(plugin: DiscoveredPlugin, source: string): void {
  p.log.info(`${pc.bold("Source:")} ${source}`);
  p.log.info(
    `${pc.bold("Found Plugin:")} ${pc.cyan(plugin.name)} ${
      plugin.version ? pc.dim(`(v${plugin.version})`) : ""
    }`
  );

  if (plugin.skills.length > 0) {
    const skillsList = plugin.skills.map((s) => s.name).join(", ");
    p.log.message(`  - ${pc.bold("Skills:")} ${skillsList}`);
  } else {
    p.log.message(`  - ${pc.dim("Skills: None")}`);
  }

  const mcpNames = Object.keys(plugin.mcpServers);
  if (mcpNames.length > 0) {
    for (const name of mcpNames) {
      const server = plugin.mcpServers[name];
      const cmd = [server.command, ...(server.args || [])].join(" ");
      p.log.message(`  - ${pc.bold("MCP Server:")} ${pc.yellow(name)} ${pc.dim(`(${cmd})`)}`);
    }
  } else {
    p.log.message(`  - ${pc.dim("MCP Servers: None")}`);
  }
}

export async function confirmSecurityTrust(
  plugin: DiscoveredPlugin,
  isNonInteractive: boolean
): Promise<boolean> {
  const mcpNames = Object.keys(plugin.mcpServers);
  if (mcpNames.length === 0 || isNonInteractive) {
    return true;
  }

  p.log.warn(pc.yellow("This plugin will register executable commands:"));
  for (const name of mcpNames) {
    const s = plugin.mcpServers[name];
    const fullCmd = [s.command, ...(s.args || [])].join(" ");
    p.log.message(`  ${pc.bold("$")} ${pc.green(fullCmd)}`);
  }

  const shouldProceed = await p.confirm({
    message: "Do you trust this plugin and want to proceed?",
    initialValue: false
  });

  if (p.isCancel(shouldProceed) || !shouldProceed) {
    return false;
  }

  return true;
}

export async function promptEnvVariables(
  envDefinitions: Record<string, EnvVarDefinition>,
  isNonInteractive: boolean
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const entries = Object.entries(envDefinitions);

  if (entries.length === 0) {
    return result;
  }

  for (const [key, def] of entries) {
    // If running non-interactively or env already exists
    if (isNonInteractive) {
      if (process.env[key]) {
        result[key] = process.env[key]!;
      } else if (def.default) {
        result[key] = def.default;
      }
      continue;
    }

    const isSecret = /KEY|SECRET|TOKEN|PASSWORD|AUTH|CREDENTIAL/i.test(key);
    const existingVal = process.env[key] || def.default || "";
    const description = def.description ? ` (${def.description})` : "";
    const label = `${key}${description}`;

    if (isSecret) {
      const answer = await p.password({
        message: `Enter value for ${pc.cyan(label)}:`,
        validate: (val) => {
          if (def.required && !val && !existingVal) {
            return `${key} is required.`;
          }
        }
      });
      if (p.isCancel(answer)) {
        p.cancel("Canceled.");
        process.exit(0);
      }
      result[key] = answer || existingVal;
    } else {
      const answer = await p.text({
        message: `Enter value for ${pc.cyan(label)}:`,
        initialValue: existingVal,
        validate: (val) => {
          if (def.required && !val) {
            return `${key} is required.`;
          }
        }
      });
      if (p.isCancel(answer)) {
        p.cancel("Canceled.");
        process.exit(0);
      }
      result[key] = answer;
    }
  }

  return result;
}

export async function selectTargetHarnesses(
  detectedList: Array<{ harness: AgentHarness; detected: boolean }>,
  preselectedIds?: string[],
  isNonInteractive?: boolean
): Promise<AgentHarness[]> {
  // If specific agents are requested via -a flag
  if (preselectedIds && preselectedIds.length > 0) {
    const selected: AgentHarness[] = [];
    for (const id of preselectedIds) {
      const match = detectedList.find((item) => item.harness.id === id);
      if (match) {
        selected.push(match.harness);
      }
    }
    return selected;
  }

  // If non-interactive mode, automatically select all detected harnesses
  if (isNonInteractive) {
    const detected = detectedList
      .filter((item) => item.detected)
      .map((item) => item.harness);
    return detected.length > 0 ? detected : [detectedList.find(d => d.harness.id === "workspace")!.harness];
  }

  // Interactive selection
  const options = detectedList.map((item) => {
    const label = item.detected
      ? `${item.harness.name} ${pc.green("(detected)")}`
      : `${item.harness.name} ${pc.dim("(not detected)")}`;
    return {
      value: item.harness.id,
      label,
      hint: item.detected ? "detected" : undefined
    };
  });

  const initialValues = detectedList
    .filter((item) => item.detected)
    .map((item) => item.harness.id);

  const selectedIds = await p.multiselect({
    message: "Select agents to configure:",
    options,
    initialValues,
    required: false
  });

  if (p.isCancel(selectedIds)) {
    p.cancel("Canceled.");
    process.exit(0);
  }

  return detectedList
    .filter((item) => (selectedIds as string[]).includes(item.harness.id))
    .map((item) => item.harness);
}

export function displayCompleted(
  pluginName: string,
  configuredHarnesses: string[],
  dryRun?: boolean
): void {
  const prefix = dryRun ? "[DRY RUN] " : "";
  p.outro(
    pc.green(
      `${prefix}Configured ${pc.bold(pluginName)} for ${configuredHarnesses.join(", ")}.`
    )
  );
}

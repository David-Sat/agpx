import { Command } from "commander";
import pc from "picocolors";
import { installPlugin, removePlugin, updatePlugin } from "./core/installer.js";
import { listInstalledPlugins } from "./core/registry.js";
import { displayBanner } from "./ui/prompts.js";

const program = new Command();

program
  .name("agpx")
  .description("Package manager for agent skills and MCP servers")
  .version("0.1.0");

program
  .command("add")
  .description("Install an agent plugin from GitHub, Git URL, or local path")
  .argument("<source>", "Plugin source (owner/repo, git URL, or local directory)")
  .option("-g, --global", "Install globally across detected agents (default)", true)
  .option("-p, --project", "Install in the current repository only (.mcp.json + skills/)")
  .option("-a, --agent <names...>", "Target specific agents (antigravity, claude, cursor, hermes, openclaw, deepseek, pi, etc.)")
  .option("--path <path>", "Install into custom JSON configuration file or directory")
  .option("-y, --yes", "Run without prompts (accept detected agents and defaults)")
  .option("--dry-run", "Preview changes without writing to disk")
  .action(async (source, options) => {
    try {
      await installPlugin(source, {
        global: options.global,
        project: options.project,
        agent: options.agent,
        path: options.path,
        yes: options.yes,
        dryRun: options.dryRun
      });
    } catch (err: unknown) {
      console.error(pc.red(`\nError: ${(err as Error).message}`));
      process.exit(1);
    }
  });

program
  .command("list")
  .description("List all installed agent plugins and their configured agents")
  .option("-p, --project", "List plugins installed for the local project")
  .action(async (options) => {
    try {
      displayBanner();
      const plugins = await listInstalledPlugins(options.project);

      if (plugins.length === 0) {
        console.log(pc.yellow("No installed plugins found."));
        return;
      }

      console.log(pc.bold(`Installed Plugins (${plugins.length}):\n`));
      for (const p of plugins) {
        console.log(`  ${pc.cyan(pc.bold(p.name))} ${pc.dim(`(v${p.version})`)}`);
        console.log(`    ${pc.dim("Source:")}     ${p.source}`);
        console.log(`    ${pc.dim("Agents:")}     ${p.agents.join(", ")}`);
        if (p.mcpServers.length > 0) {
          console.log(`    ${pc.dim("MCP:")}        ${p.mcpServers.join(", ")}`);
        }
        if (p.skills.length > 0) {
          console.log(`    ${pc.dim("Skills:")}     ${p.skills.join(", ")}`);
        }
        console.log(`    ${pc.dim("Installed:")}  ${new Date(p.installedAt).toLocaleString()}\n`);
      }
    } catch (err: unknown) {
      console.error(pc.red(`\nError: ${(err as Error).message}`));
      process.exit(1);
    }
  });

program
  .command("remove")
  .alias("rm")
  .alias("uninstall")
  .description("Remove an installed plugin's skills and MCP entries")
  .argument("<name>", "Name of the plugin to remove")
  .option("-p, --project", "Remove from local project configuration")
  .option("--dry-run", "Preview removal without modifying disk")
  .action(async (name, options) => {
    try {
      await removePlugin(name, {
        project: options.project,
        dryRun: options.dryRun
      });
    } catch (err: unknown) {
      console.error(pc.red(`\nError: ${(err as Error).message}`));
      process.exit(1);
    }
  });

program
  .command("update")
  .alias("up")
  .description("Update an installed plugin from its git source")
  .argument("<name>", "Name of the plugin to update")
  .option("-p, --project", "Update within local project configuration")
  .option("-y, --yes", "Run without prompts")
  .option("--dry-run", "Preview updates without writing to disk")
  .action(async (name, options) => {
    try {
      await updatePlugin(name, {
        project: options.project,
        yes: options.yes,
        dryRun: options.dryRun
      });
    } catch (err: unknown) {
      console.error(pc.red(`\nError: ${(err as Error).message}`));
      process.exit(1);
    }
  });

// Support shorthand: if first argument is not a command, treat as "add"
const args = process.argv.slice(2);
const knownCommands = ["add", "list", "remove", "rm", "uninstall", "update", "up", "--help", "-h", "--version", "-V"];
if (args.length > 0 && !knownCommands.includes(args[0]) && !args[0].startsWith("-")) {
  process.argv.splice(2, 0, "add");
}

program.parse();

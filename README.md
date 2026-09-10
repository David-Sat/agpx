# agentpx

`agentpx` installs prompt skills (`SKILL.md`), Model Context Protocol ([MCP](https://modelcontextprotocol.io/)) servers, and environment variables across coding agents.

[![NPM Version](https://img.shields.io/npm/v/agentpx.svg)](https://www.npmjs.com/package/agentpx)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

```bash
npx agentpx add <github-repo>
```

---

## Why This Exists

Prompt managers like [`skills`](https://www.npmjs.com/package/skills) copy markdown files into agent directories, but leave out MCP servers and tool runtimes. Anthropic's plugin system packages prompts and MCP servers together, but locks them to Claude Code. MCP registries list server commands, but skip the prompts that show the model when and how to call those tools.

`agpx` reads standard [Agent Plugin manifests](https://agent-plugins.org/) and handles all three pieces in one run:
1. Copies prompt skills to the target agent directory.
2. Merges MCP server definitions into each agent configuration file without touching existing keys.
3. Prompts for required environment variables, with masked input for keys and tokens.
4. Asks for confirmation before registering executable commands.

---

## Supported Agents

`agentpx` detects installed agents automatically and routes MCP servers and skills to each agent's native directory:

- **Core agents:** Google Antigravity, Claude Code, Cursor, Windsurf, Claude Desktop, Zed
- **Autonomous agents:** Hermes, OpenClaw / Nanoclaw, DeepSeek, Pi, Devin
- **Developer assistants:** Cline, Roo Code, Continue, Goose, OpenHands, Trae, Qwen Code
- **Workspace:** Local project repositories (`.mcp.json` and `skills/`)

---

## Discovery Order

When given a repository URL or local folder, `agpx` looks for components in this order:

```text
Target repository
├── plugin.json               <- Manifest standard (agent-plugins.org)
├── mcp_config.json           <- MCP server definitions
├── .claude-plugin/
│   └── plugin.json           <- Claude Code plugin manifest
├── .mcp.json or mcp.json     <- MCP config
└── skills/
    └── <skill-name>/
        └── SKILL.md          <- Prompt workflows
```

---

## Usage

### Install a Plugin

```bash
# GitHub shorthand
npx agentpx add David-Sat/lux-edit

# Explicit npm package
npx agentpx add npm:lux-edit
npx agentpx add npm:@david-sat/lux-edit

# Full Git URL
npx agentpx add https://github.com/David-Sat/lux-edit.git

# Local folder
npx agentpx add ./my-local-plugin
```

#### Options

- `-g, --global`: Install across detected user agent configurations (default).
- `-p, --project`: Install in the current repository only (`.mcp.json` and `skills/`).
- `-a, --agent <names...>`: Target specific agents (e.g. `-a claude cursor`).
- `--path <path>`: Install into a specific JSON file or directory.
- `-y, --yes`: Run without prompts. Uses detected agents and environment variables from `process.env`.
- `--dry-run`: Print changes without writing to disk.

### List Installed Plugins

```bash
npx agentpx list
npx agentpx list --project
```

### Update a Plugin

```bash
npx agentpx update lux-edit
```

Fetches the latest commits from the original source and updates registered files.

### Remove a Plugin

```bash
npx agentpx remove lux-edit
```

Deletes registered MCP server keys and removes installed skill directories. Other configuration keys stay untouched.

---

## How It Works

### Safe JSON Merging

`agpx` never overwrites existing configuration files. It parses the target JSON, adds or updates the plugin key under `mcpServers` (or `context_servers` in Zed), and writes back the file with 2-space indentation. When removing a plugin, it deletes only the registered keys and leaves user settings alone.

### Environment Variables

When `plugin.json` lists environment variables:
- Interactive mode prompts for values. Keys containing `KEY`, `SECRET`, `PASSWORD`, or `TOKEN` mask user input.
- Non-interactive mode (`-y`) reads matching keys from `process.env`.
- Values save directly to each server's `env` block in the agent configuration.

### Security Checks

MCP servers run local commands. Before writing anything, `agpx` prints the exact command and arguments it plans to configure and asks if you trust the plugin. Pass `-y` to skip this in automated scripts.

---

## Development

```bash
git clone https://github.com/David-Sat/agpx.git
cd agpx
npm install
npm test
npm run build
```

---

## Specifications

- [Agent Plugins specification](https://agent-plugins.org/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code plugins](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/plugins)

---

## License

[MIT](LICENSE) (c) David Satomi

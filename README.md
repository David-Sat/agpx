# agpx

agpx installs prompt skills (`SKILL.md`), Model Context Protocol ([MCP](https://modelcontextprotocol.io/)) servers, and environment variables across coding agents.

[![NPM Version](https://img.shields.io/npm/v/agpx.svg)](https://www.npmjs.com/package/agpx)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

```bash
npx agpx add <github-repo>
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

| Agent | Detection | MCP config | Skills directory |
| :--- | :--- | :--- | :--- |
| Google Antigravity | `~/.gemini/` | `~/.gemini/config/mcp_config.json` | `~/.gemini/config/plugins/<name>/` |
| Claude Code | `~/.claude/` | `~/.claude/mcp.json` | `~/.claude/skills/<name>/` |
| Cursor | `~/.cursor/` or project `.cursor/` | `~/.cursor/mcp.json` or `.cursor/mcp.json` | `~/.cursor/skills/` or `.cursor/rules/` |
| Windsurf | `~/.codeium/windsurf/` | `~/.codeium/windsurf/mcp_config.json` | `~/.codeium/windsurf/skills/` |
| Claude Desktop | OS config path | `claude_desktop_config.json` | N/A (MCP only) |
| Zed | `~/.config/zed/` | `settings.json` (`context_servers`) | N/A (MCP only) |
| Hermes Agent | `~/.hermes/` | `~/.hermes/mcp.json` | `~/.hermes/skills/` |
| OpenClaw / Nanoclaw | `~/.openclaw/` or `~/.nanoclaw/` | `~/.openclaw/mcp.json` | `~/.openclaw/skills/` |
| DeepSeek | `~/.deepseek/` | `~/.deepseek/mcp.json` | `~/.deepseek/skills/` |
| Pi | `~/.pi/agent/` | `~/.pi/agent/mcp.json` | `~/.pi/agent/skills/` |
| Devin | `~/.config/devin/` or `~/.devin/` | `~/.config/devin/mcp.json` | `~/.config/devin/skills/` |
| Cline | VS Code global storage or `~/.cline/` | `cline_mcp_settings.json` | `~/.cline/skills/` or `.clinerules/` |
| Roo Code | VS Code global storage or `~/.roo/` | `cline_mcp_settings.json` | `~/.roo/skills/` or `.roo/rules/` |
| Continue | `~/.continue/` | `~/.continue/config.json` | `~/.continue/skills/` |
| Goose | `~/.config/goose/` | `~/.config/goose/mcp.json` | `~/.goose/skills/` |
| OpenHands | `~/.openhands/` | `~/.openhands/mcp.json` | `~/.openhands/skills/` |
| Trae | `~/.trae/` | `~/.trae/mcp.json` | `~/.trae/skills/` |
| Qwen Code | `~/.qwen/` | `~/.qwen/mcp.json` | `~/.qwen/skills/` |
| Workspace (In-Repo) | Current directory | `./.mcp.json` | `./skills/<name>/` |

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
npx agpx add David-Sat/lux-edit

# Full Git URL
npx agpx add https://github.com/David-Sat/lux-edit.git

# Local folder
npx agpx add ./my-local-plugin
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
npx agpx list
npx agpx list --project
```

### Update a Plugin

```bash
npx agpx update lux-edit
```

Fetches the latest commits from the original source and updates registered files.

### Remove a Plugin

```bash
npx agpx remove lux-edit
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

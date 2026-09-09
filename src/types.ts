export interface PluginAuthor {
  name: string;
  email?: string;
  url?: string;
}

export interface EnvVarDefinition {
  description?: string;
  required?: boolean;
  default?: string;
}

export interface PluginManifest {
  $schema?: string;
  name: string;
  version?: string;
  description?: string;
  author?: string | PluginAuthor;
  environmentVariables?: Record<string, EnvVarDefinition>;
  mcpConfig?: string;
  skills?: string | string[];
}

export interface ClaudePluginManifest {
  name: string;
  version?: string;
  description?: string;
  author?: string | PluginAuthor;
  mcpServers?: Record<string, McpServerConfig>;
  environmentVariables?: Record<string, EnvVarDefinition>;
}

export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  disabled?: boolean;
  alwaysAllow?: string[];
  [key: string]: unknown;
}

export interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

export interface DiscoveredSkill {
  name: string;
  dirPath: string;
  skillFilePath: string;
  description?: string;
}

export interface DiscoveredPlugin {
  name: string;
  version: string;
  description: string;
  rootDir: string;
  manifest: PluginManifest;
  mcpServers: Record<string, McpServerConfig>;
  skills: DiscoveredSkill[];
  environmentVariables: Record<string, EnvVarDefinition>;
}

export type AgentHarnessId =
  | "antigravity"
  | "claude"
  | "cursor"
  | "windsurf"
  | "desktop"
  | "zed"
  | "workspace"
  | "hermes"
  | "openclaw"
  | "deepseek"
  | "pi"
  | "devin"
  | "cline"
  | "roo"
  | "continue"
  | "goose"
  | "openhands"
  | "trae"
  | "qwen";

export interface HarnessInstallOptions {
  projectMode?: boolean;
  customPath?: string;
  dryRun?: boolean;
}

export interface AgentHarness {
  readonly id: AgentHarnessId;
  readonly name: string;
  detect(): Promise<boolean>;
  getMcpConfigPath(options?: HarnessInstallOptions): string | null;
  getSkillsTargetDir(options?: HarnessInstallOptions): string | null;
  installMcp(
    servers: Record<string, McpServerConfig>,
    options?: HarnessInstallOptions
  ): Promise<string>;
  installSkills(
    skills: DiscoveredSkill[],
    options?: HarnessInstallOptions
  ): Promise<string[]>;
  remove(
    pluginName: string,
    serverKeys: string[],
    skillNames: string[],
    options?: HarnessInstallOptions
  ): Promise<{ mcpModified: boolean; removedSkills: string[] }>;
}

export interface InstalledPluginRecord {
  name: string;
  source: string;
  version: string;
  installedAt: string;
  agents: AgentHarnessId[];
  mcpServers: string[];
  skills: string[];
  env: string[];
  projectMode?: boolean;
}

export interface RegistryData {
  version: "1.0.0";
  plugins: Record<string, InstalledPluginRecord>;
}

export interface AddCommandOptions {
  global?: boolean;
  project?: boolean;
  agent?: string[];
  path?: string;
  yes?: boolean;
  dryRun?: boolean;
}

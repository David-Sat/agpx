import os from "node:os";
import path from "node:path";

export function getHomeDir(): string {
  return os.homedir();
}

export function expandHome(filePath: string): string {
  if (filePath.startsWith("~/") || filePath === "~") {
    return path.join(getHomeDir(), filePath.slice(1));
  }
  return filePath;
}

export function getClaudeDesktopConfigPath(): string {
  const platform = process.platform;
  const home = getHomeDir();

  if (platform === "darwin") {
    return path.join(
      home,
      "Library",
      "Application Support",
      "Claude",
      "claude_desktop_config.json"
    );
  }
  if (platform === "win32") {
    const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
    return path.join(appData, "Claude", "claude_desktop_config.json");
  }
  return path.join(home, ".config", "Claude", "claude_desktop_config.json");
}

export function getZedConfigDir(): string {
  const platform = process.platform;
  const home = getHomeDir();

  if (platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Zed");
  }
  if (platform === "win32") {
    const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
    return path.join(appData, "Zed");
  }
  return path.join(home, ".config", "zed");
}

export function getAgpDataDir(): string {
  return path.join(getHomeDir(), ".agpx");
}

export function getAgpCacheDir(): string {
  return path.join(getAgpDataDir(), "cache");
}

export function getAgpGlobalRegistryPath(): string {
  return path.join(getAgpDataDir(), "installed.json");
}

export function getAgpProjectRegistryPath(cwd: string = process.cwd()): string {
  return path.join(cwd, ".agpx.json");
}

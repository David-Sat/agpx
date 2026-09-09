import fs from "node:fs/promises";
import path from "node:path";
import { simpleGit, type SimpleGit } from "simple-git";
import { expandHome, getAgpCacheDir } from "../utils/paths.js";

export interface ParsedSource {
  type: "local" | "git";
  raw: string;
  url?: string;
  localPath?: string;
  repoIdentifier: string; // e.g. "David-Sat/lux-edit" or local folder name
}

export function parseSource(source: string, cwd: string = process.cwd()): ParsedSource {
  const trimmed = source.trim();

  // Local directory check
  if (
    trimmed.startsWith("./") ||
    trimmed.startsWith("../") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("~/") ||
    trimmed.startsWith(".\\") ||
    trimmed.startsWith("..\\")
  ) {
    const resolved = path.resolve(cwd, expandHome(trimmed));
    const baseName = path.basename(resolved);
    return {
      type: "local",
      raw: source,
      localPath: resolved,
      repoIdentifier: baseName
    };
  }

  // GitHub shorthand: owner/repo
  const githubShorthandRegex = /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/;
  const ghMatch = trimmed.match(githubShorthandRegex);
  if (ghMatch) {
    const owner = ghMatch[1];
    const repo = ghMatch[2].replace(/\.git$/, "");
    return {
      type: "git",
      raw: source,
      url: `https://github.com/${owner}/${repo}.git`,
      repoIdentifier: `${owner}/${repo}`
    };
  }

  // Git URL (https or git@ or ssh)
  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("git@") ||
    trimmed.startsWith("ssh://")
  ) {
    let repoId = trimmed
      .replace(/^https?:\/\//, "")
      .replace(/^git@[^:]+:/, "")
      .replace(/\.git$/, "")
      .replace(/[^a-zA-Z0-9_.-]/g, "_");

    return {
      type: "git",
      raw: source,
      url: trimmed,
      repoIdentifier: repoId
    };
  }

  // Check if it's a relative folder in cwd without ./ prefix
  const potentialLocal = path.resolve(cwd, trimmed);
  return {
    type: "local",
    raw: source,
    localPath: potentialLocal,
    repoIdentifier: path.basename(potentialLocal)
  };
}

export async function resolvePluginSource(
  source: string,
  cwd: string = process.cwd()
): Promise<{ sourceDir: string; parsed: ParsedSource }> {
  const parsed = parseSource(source, cwd);

  if (parsed.type === "local") {
    if (!parsed.localPath) {
      throw new Error(`Invalid local path for source: ${source}`);
    }
    try {
      const stat = await fs.stat(parsed.localPath);
      if (!stat.isDirectory()) {
        throw new Error(`Path ${parsed.localPath} is not a directory`);
      }
    } catch {
      throw new Error(`Directory does not exist: ${parsed.localPath}`);
    }
    return { sourceDir: parsed.localPath, parsed };
  }

  // Remote Git repo: shallow clone to cache
  const cacheRoot = getAgpCacheDir();
  const safeDirName = parsed.repoIdentifier.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const targetDir = path.join(cacheRoot, safeDirName);

  await fs.mkdir(cacheRoot, { recursive: true });

  const exists = await fs
    .stat(targetDir)
    .then((s) => s.isDirectory())
    .catch(() => false);

  const git: SimpleGit = simpleGit();

  if (exists) {
    try {
      const repoGit = simpleGit(targetDir);
      await repoGit.fetch(["--depth", "1", "origin"]);
      // Reset hard to origin/HEAD or master/main
      try {
        await repoGit.reset(["--hard", "origin/HEAD"]);
      } catch {
        await repoGit.pull();
      }
    } catch {
      // If fetching fails, clean and re-clone
      await fs.rm(targetDir, { recursive: true, force: true });
      await git.clone(parsed.url!, targetDir, ["--depth", "1"]);
    }
  } else {
    await git.clone(parsed.url!, targetDir, ["--depth", "1"]);
  }

  return { sourceDir: targetDir, parsed };
}

import fs from "node:fs/promises";
import path from "node:path";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { simpleGit, type SimpleGit } from "simple-git";
import { expandHome, getAgpCacheDir } from "../utils/paths.js";

const execFile = promisify(execFileCallback);

export interface ParsedSource {
  type: "local" | "git" | "npm";
  raw: string;
  url?: string;
  localPath?: string;
  npmPackage?: string;
  repoIdentifier: string; // e.g. "David-Sat/lux-edit" or "lux-edit"
}

export function parseSource(source: string, cwd: string = process.cwd()): ParsedSource {
  const trimmed = source.trim();

  // Explicit npm package: npm:<package> or npm:@scope/package
  if (trimmed.startsWith("npm:")) {
    const pkgName = trimmed.slice(4).trim();
    if (!pkgName) {
      throw new Error("Invalid npm package source: package name cannot be empty");
    }
    return {
      type: "npm",
      raw: source,
      npmPackage: pkgName,
      repoIdentifier: pkgName
    };
  }

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

  // Ambiguous bare string security check
  throw new Error(
    `Ambiguous plugin source '${trimmed}'.\n` +
      `  • To install from GitHub, use owner/repo (e.g. 'David-Sat/${trimmed}')\n` +
      `  • To install from npm, use the npm: prefix (e.g. 'npm:${trimmed}')\n` +
      `  • To install from a local folder, use './' (e.g. './${trimmed}')`
  );
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

  // Explicit npm package: pack and extract securely
  if (parsed.type === "npm") {
    if (!parsed.npmPackage) {
      throw new Error(`Invalid npm package source: ${source}`);
    }

    const cacheRoot = path.join(getAgpCacheDir(), "npm");
    const safePkgDir = parsed.npmPackage.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const targetDir = path.join(cacheRoot, safePkgDir);
    const tempPackDir = path.join(cacheRoot, `.temp_${safePkgDir}_${Date.now()}`);

    await fs.mkdir(cacheRoot, { recursive: true });
    await fs.mkdir(tempPackDir, { recursive: true });

    try {
      // Step 1: Pack the tarball from npm without executing scripts
      const { stdout } = await execFile("npm", [
        "pack",
        parsed.npmPackage,
        "--ignore-scripts",
        "--pack-destination",
        tempPackDir
      ]);

      const tarballName = stdout.trim().split("\n").pop()?.trim();
      if (!tarballName) {
        throw new Error(`Failed to download npm tarball for ${parsed.npmPackage}`);
      }

      const tarballPath = path.join(tempPackDir, tarballName);

      // Step 2: Extract tarball safely (standard npm tarball extracts into 'package/')
      await execFile("tar", ["-xzf", tarballPath, "-C", tempPackDir]);

      const extractedPackageDir = path.join(tempPackDir, "package");
      const stat = await fs.stat(extractedPackageDir);
      if (!stat.isDirectory()) {
        throw new Error(`Malformed npm package tarball for ${parsed.npmPackage}`);
      }

      // Step 3: Atomic move into target cache directory
      await fs.rm(targetDir, { recursive: true, force: true });
      await fs.rename(extractedPackageDir, targetDir);

      return { sourceDir: targetDir, parsed };
    } finally {
      // Clean up temporary packing folder
      await fs.rm(tempPackDir, { recursive: true, force: true });
    }
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

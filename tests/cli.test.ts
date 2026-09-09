import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import path from "node:path";

describe("CLI entrypoint", () => {
  const cliPath = path.resolve(__dirname, "../dist/cli.js");

  it("prints version string", () => {
    const output = execSync(`node ${cliPath} --version`, { encoding: "utf8" });
    expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("prints help documentation with commands", () => {
    const output = execSync(`node ${cliPath} --help`, { encoding: "utf8" });
    expect(output).toContain("agentpx");
    expect(output).toContain("add");
    expect(output).toContain("remove");
    expect(output).toContain("list");
    expect(output).toContain("update");
  });

  it("supports dry-run add on a dummy repository", () => {
    const output = execSync(`node ${cliPath} add ./ --dry-run -y`, {
      encoding: "utf8",
      cwd: path.resolve(__dirname, "..")
    });
    expect(output).toBeDefined();
  });
});

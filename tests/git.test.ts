import { describe, it, expect } from "vitest";
import path from "node:path";
import { parseSource } from "../src/core/git.js";

describe("Git & Source Parsing", () => {
  it("should parse GitHub shorthand (owner/repo)", () => {
    const res = parseSource("David-Sat/lux-edit");
    expect(res.type).toBe("git");
    expect(res.url).toBe("https://github.com/David-Sat/lux-edit.git");
    expect(res.repoIdentifier).toBe("David-Sat/lux-edit");
  });

  it("should parse GitHub shorthand with .git extension", () => {
    const res = parseSource("facebook/react.git");
    expect(res.type).toBe("git");
    expect(res.url).toBe("https://github.com/facebook/react.git");
  });

  it("should parse full HTTPS git URLs", () => {
    const res = parseSource("https://gitlab.com/group/repo.git");
    expect(res.type).toBe("git");
    expect(res.url).toBe("https://gitlab.com/group/repo.git");
  });

  it("should parse SSH git URLs", () => {
    const res = parseSource("git@github.com:David-Sat/lux-edit.git");
    expect(res.type).toBe("git");
    expect(res.url).toBe("git@github.com:David-Sat/lux-edit.git");
  });

  it("should parse relative local path", () => {
    const cwd = "/my/project";
    const res = parseSource("./my-plugin", cwd);
    expect(res.type).toBe("local");
    expect(res.localPath).toBe(path.resolve(cwd, "./my-plugin"));
    expect(res.repoIdentifier).toBe("my-plugin");
  });

  it("should parse parent relative path", () => {
    const cwd = "/my/project";
    const res = parseSource("../sibling-plugin", cwd);
    expect(res.type).toBe("local");
    expect(res.localPath).toBe(path.resolve(cwd, "../sibling-plugin"));
  });

  it("should parse absolute path", () => {
    const res = parseSource("/absolute/path/to/plugin");
    expect(res.type).toBe("local");
    expect(res.localPath).toBe("/absolute/path/to/plugin");
  });
});

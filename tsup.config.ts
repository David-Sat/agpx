import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    cli: "src/cli.ts",
    index: "src/index.ts"
  },
  platform: "node",
  format: ["esm"],
  target: "node18",
  shims: true,
  clean: true,
  dts: true,
  sourcemap: true,
  banner: {
    js: `#!/usr/bin/env node
import { createRequire as __createRequire } from "node:module";
const require = __createRequire(import.meta.url);
`
  },
  noExternal: [
    "@clack/prompts",
    "commander",
    "picocolors"
  ]
});

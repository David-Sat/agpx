# Contributing to `agpx`

Thank you for your interest in contributing to `agpx` (Universal Agent Plugin Installer)! We welcome contributions from the developer and agent engineering community.

---

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/David-Sat/agpx.git
   cd agpx
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the standalone bundle:**
   ```bash
   npm run build
   ```

4. **Run the test suite:**
   ```bash
   npm test
   ```

5. **Test the CLI locally:**
   ```bash
   ./bin/cli.mjs --help
   ```

---

## Commit Convention & Automated Releases

We use [Conventional Commits](https://www.conventionalcommits.org/) for automated semantic versioning, changelog generation, and npm publishing via **Release Please**:

* `feat: ...` — New feature or capability (triggers a **MINOR** version bump, e.g. `0.1.0` -> `0.2.0`)
* `fix: ...` — Bug fix or error handling enhancement (triggers a **PATCH** version bump, e.g. `0.1.0` -> `0.1.1`)
* `docs: ...` — Documentation updates or examples (no version bump)
* `chore: ...` — Build, dependency, or internal maintenance tasks (no version bump)
* `refactor: ...` — Code refactoring without behavioral changes
* `feat!: ...` or `fix!: ...` — Breaking change (triggers a **MAJOR** bump or pre-1.0 minor bump)

---

## Submitting a Pull Request

1. Fork the repository and create your branch from `main` (or `master`).
2. Implement your changes with corresponding unit tests in `tests/`.
3. Ensure all tests pass (`npm test`) and the bundle builds cleanly (`npm run build`).
4. Commit your changes following the Conventional Commits format.
5. Submit a Pull Request describing your changes. Once merged into the main branch, Release Please will automatically manage release PRs and tags.

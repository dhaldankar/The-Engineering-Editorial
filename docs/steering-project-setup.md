# Steering Document: Project Setup & Package Management

This document serves as a guide for developers and AI agents working on this project. It outlines the core setup, package management conventions, and repository structure to ensure consistency across the codebase.

## 1. Package Manager: `pnpm`

This repository strictly uses `pnpm` (Performant NPM) for package management. **Do not use `npm` or `yarn`** commands, as they can cause lockfile conflicts and inconsistent dependency resolution.

### Why `pnpm`?
`pnpm` uses a global store and hard links, which makes it significantly faster and drastically reduces disk space usage compared to standard `npm`. It also has robust, built-in support for monorepos (workspaces).

### Core Commands

| Action | `npm` Equivalent | `pnpm` Command |
| :--- | :--- | :--- |
| **Install all dependencies** | `npm install` | `pnpm install` |
| **Add a production dependency** | `npm install <pkg>` | `pnpm add <pkg>` |
| **Add a development dependency** | `npm install -D <pkg>` | `pnpm add -D <pkg>` |
| **Remove a dependency** | `npm uninstall <pkg>` | `pnpm remove <pkg>` |
| **Update dependencies** | `npm update` | `pnpm update` |
| **Run a script** | `npm run <script>` | `pnpm run <script>` (or just `pnpm <script>`) |

---

## 2. Monorepo (Workspace) Architecture

This project is structured as a monorepo utilizing `pnpm` workspaces. This means multiple apps and shared packages are housed within the same repository.

### Navigating the Workspace

Typical monorepo directories are structured as follows:
- `/apps/*`: Contains user-facing applications (e.g., a frontend app, an admin dashboard).
- `/packages/*`: Contains shared internal libraries (e.g., UI components, shared utilities, shared TS configs).

### Working with Specific Apps/Packages

When you are at the root of the repository, you can execute commands for specific packages without needing to `cd` into their directories. This is done using the `--filter` flag.

**Examples:**

* **Run the dev server for a specific app:**
  ```bash
  pnpm --filter my-web-app dev
  ```
* **Add a dependency to a specific app:**
  ```bash
  pnpm --filter my-web-app add lodash
  ```
* **Build all apps:**
  ```bash
  pnpm run build
  ```
  *(Assuming a root build script is configured, or you can use `pnpm -r run build` to recursively build everything).*

### Adding a New App to the Monorepo

`pnpm` does not have a native "create workspace app" command. To scaffold a new app, simply navigate to the `apps/` directory and use the standard `pnpm create` command:

```bash
cd apps
pnpm create vite new-app-name
```
Because the `pnpm-workspace.yaml` file automatically tracks the `apps/*` directory, `pnpm` will instantly recognize the new app as part of the monorepo upon creation.

---

## 3. General "Sanity Check" Guidelines

When maintaining or extending this setup:
1. **Always check the lockfile:** Ensure `pnpm-lock.yaml` is the only lockfile being generated. Delete any accidental `package-lock.json` or `yarn.lock` files immediately.
2. **Global vs Local:** Avoid installing packages globally (`-g`) unless strictly necessary for tooling. Rely on local `devDependencies` and run them via `pnpm <script>`.
3. **Workspace Dependencies:** When one internal package depends on another, use workspace protocols (e.g., `"my-shared-ui": "workspace:*"` in `package.json`).

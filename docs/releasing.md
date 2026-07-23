# Shardix Releasing & CI/CD Guide

This guide explains how to release new versions of Shardix packages to **npm** using Changesets and GitHub Actions.

---

## 🛠️ How to Add a Changeset

When making changes to any package under `packages/`:

1. Run the changeset command:
   ```bash
   pnpm changeset
   ```
2. Select the packages that were updated.
3. Choose the SemVer bump type:
   - `patch`: Bug fixes and small patches
   - `minor`: New features and non-breaking additions
   - `major`: Breaking changes
4. Enter a summary of the changes.
5. Commit the generated `.changeset/*.md` file along with your code.

---

## 🚀 Automated Release Pipeline

When a PR containing changesets is merged into the `main` branch:

1. **GitHub Actions CI (`ci.yml`)**: Builds all packages and runs the Vitest test suite.
2. **Release Workflow (`release.yml`)**:
   - Creates a **"chore: release packages"** PR automatically.
   - Once merged, GitHub Actions builds and publishes all updated `@shardix/*` packages to the **npm registry**.
   - Creates GitHub Releases and tags (`v0.5.0`, `v0.5.1`, etc.).

---

## 🏷️ Pre-releases (Alpha/Beta/RC)

To enter pre-release mode for upcoming versions:

```bash
# Enter beta mode
pnpm changeset pre enter beta

# Exit pre-release mode
pnpm changeset pre exit
```

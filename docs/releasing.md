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

## ⚠️ Troubleshooting: GitHub Actions PR Permissions

If you encounter the error:
`Error: GitHub Actions is not permitted to create or approve pull requests`

### Option 1: Enable Permission in Repository Settings (Recommended)

1. Go to your GitHub repository: `Settings -> Actions -> General`.
2. Scroll down to **Workflow permissions**.
3. Select **Read and write permissions**.
4. Check the checkbox: **"Allow GitHub Actions to create and approve pull requests"**.
5. Click **Save**.

### Option 2: Use a Personal Access Token (PAT)

If your GitHub Organization restricts the default `GITHUB_TOKEN`:
1. Create a Personal Access Token (PAT) with `repo` scope under GitHub `Developer Settings`.
2. Add it as a secret named `PAT_TOKEN` under repository `Settings -> Secrets and variables -> Actions`.
3. The workflow will automatically use `PAT_TOKEN` as a fallback.

---

## ⚠️ Troubleshooting: npm 404 Not Found on Publish

If you encounter the error:
`404 Not Found - PUT https://registry.npmjs.org/@shardix%2fcore - Not found`

This occurs because scoped packages (`@shardix/*`) require the Organization Scope to exist on npm:

1. Log in to [npmjs.com](https://www.npmjs.com/).
2. Click on your profile picture -> **Add Organization**.
3. Create the organization named **`shardix`** (Public/Free).
4. Create an **Automation Token** or **Granular Access Token** with read/write access to `@shardix/*`.
5. Save the token as `NPM_TOKEN` under GitHub Repository `Settings -> Secrets and variables -> Actions`.



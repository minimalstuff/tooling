# CLI reference

[README](../README.md)

```bash
pnpm dlx @minimalstuff/tooling@latest
```

Run the command from the project root. The setup is interactive; for the non-interactive `check-release` subcommand, see [below](#check-release). Without an interactive terminal, the CLI prints a message and exits with code 1. Cancelling (Ctrl+C or Esc) exits with code 130. Answering No to the first question exits with code 0 without changes.

## Questions

In order:

1. Confirmation of the current directory.
2. Tools: EditorConfig, OXC, Knip. A config already present in the current directory or the git root is labelled "(already exists)", and EditorConfig and Knip are then not pre-selected.
3. VS Code settings, asked only when OXC is selected. Adds `oxc.typeAware` and `editor.defaultFormatter` to `.vscode/settings.json` and keeps existing keys.
4. Presets (`react`, `adonisjs`, `vitest`), asked when OXC or Knip is selected. They are pre-selected from the dependencies found in the root `package.json` and in the `package.json` of `apps/*` and `packages/*`: `react`, `react-dom`, `@types/react` or `@types/react-dom` for `react`, `vitest` for `vitest`, any `@adonisjs/*` package for `adonisjs`.
5. Overwrite confirmation for each existing file.

## Files written

| File                    | Written when                          |
| ----------------------- | ------------------------------------- |
| `.editorconfig`         | EditorConfig is selected              |
| `oxlint.config.ts`      | OXC is selected                       |
| `oxfmt.config.ts`       | OXC is selected                       |
| `knip.ts`               | Knip is selected                      |
| `.vscode/settings.json` | OXC and VS Code settings are selected |

The generated `oxlint.config.ts` sets `subpathImports: false` when no `package.json` (root, `apps/*`, `packages/*`) declares subpath imports.

The CLI warns when a conflicting `.oxlintrc.json`, `.oxlintrc.jsonc`, `.oxfmtrc.json` or `.oxfmtrc.jsonc` file exists, or when a Knip config file other than `knip.ts` exists (`knip.json`, `knip.jsonc`, `.knip.json`, `.knip.jsonc`, `knip.config.ts`).

When `adonisjs` is kept, the generated `knip.ts` targets the root (`adonisjs: true`) or the workspaces (`apps/*`, `packages/*`) whose `package.json` has an `@adonisjs/*` dependency.

## Scripts

The CLI only adds the `package.json` scripts that do not exist yet:

| Script         | Command                                            |
| -------------- | -------------------------------------------------- |
| `lint`         | `oxlint`                                           |
| `lint:fix`     | `oxlint --fix`                                     |
| `format`       | `oxfmt && oxlint --fix`                            |
| `format:check` | `oxfmt --check`                                    |
| `typecheck`    | `tsc --noEmit`                                     |
| `knip`         | `knip`                                             |
| `check`        | `pnpm lint && pnpm format:check && pnpm typecheck` |

With Knip and OXC selected, `check` also runs `pnpm knip` at the end. Knip alone only adds the `knip` script. `check` always calls `pnpm`, whatever package manager the project uses.

## Packages installed

The packages are installed once at the end, after the files are written, as devDependencies with the detected package manager (npm when none is detected).

- OXC: `oxlint`, `oxfmt`, `oxlint-tsgolint`, `@minimalstuff/tooling`, plus `@adonisjs/eslint-plugin` with the `adonisjs` preset.
- Knip: `knip`, `@minimalstuff/tooling`.

When the install fails, the CLI prints the command to run yourself. The files already written are kept.

## check-release

```bash
pnpm exec tooling check-release
```

Blocks a release that would ship a `@minimalstuff/*` package in development state. It never prompts and works without a TTY. Any other subcommand prints the valid ones and exits with code 2.

It reads only `pnpm-lock.yaml` in the current directory (every YAML document: pnpm 12 writes an environment document before the main one). It reports, for packages whose name starts with `@minimalstuff/`:

- a patch: a key of `patchedDependencies` (`pnpm patch`);
- a local dependency: in the `dependencies`, `devDependencies` or `optionalDependencies` of any importer, a `version` that is not a registry version. A registry version starts with a digit (a `(peer...)` or `(patch_hash=...)` suffix is fine). `file:`, `link:` outside the current directory, git URLs, tarball URLs and `github:` are reported. A `link:` inside the repository is an internal workspace and is ignored;
- an override: an `overrides` entry whose value has a protocol other than `npm:` and `workspace:` (`file:`, `github:`, git or tarball URL, `link:` outside the current directory). Version ranges are fine.

Each finding prints its kind, package, location and how to fix it.

| Exit code | Meaning                                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| 0         | Nothing found                                                                                               |
| 1         | At least one finding                                                                                        |
| 2         | Unknown subcommand, no `pnpm-lock.yaml` (only pnpm projects are supported), or an unreadable or invalid one |

### Reusable release workflow

`.github/workflows/release.yml` runs the check, then `release-it`, in CI. It runs from `main` only and expects the checks to have passed in the caller. Inputs: `increment` (required: `patch`, `minor` or `major`), `release-script` (default `release`), `pre-release-id` (default none), `check-release-command` (default `pnpm exec tooling check-release`), `node-version-file` (default `.node-version`), `release-environment` (default `release`). Outputs: `version` and `tag`.

The job runs in the caller's environment `release` and takes the required secret `release-deploy-key`, the private key of a deploy key with write access, which you store as the environment secret `RELEASE_DEPLOY_KEY` and pass by name. The key is only loaded in the last step, which pushes the commit and the tag; dependencies are installed with `--ignore-scripts` and the GitHub release is created afterwards from the `CHANGELOG.md` section of the version (the `[Unreleased]` section for a prerelease without its own section).

A consumer `publish.yml` that calls it, pinned by commit SHA:

```yaml
name: Publish

on:
  workflow_dispatch:
    inputs:
      increment:
        type: choice
        options: [patch, minor, major]
        required: true

permissions:
  contents: read

jobs:
  checks:
    uses: ./.github/workflows/checks.yml

  release:
    needs: checks
    permissions:
      contents: write
    uses: minimalstuff/tooling/.github/workflows/release.yml@<full commit SHA> # v0.9.0
    with:
      increment: ${{ inputs.increment }}
    secrets:
      release-deploy-key: ${{ secrets.RELEASE_DEPLOY_KEY }}
```

The caller grants `contents: write`, declares no `environment` on the calling job, and needs the environment `release` with the secret `RELEASE_DEPLOY_KEY`, the deploy key and the tag ruleset described in [Release a version](releasing.md#one-time-setup).

### Apps deployed from tags

Run the check in the Dockerfile, right after the install, so an image never builds with a patched or linked library:

```dockerfile
RUN pnpm install --frozen-lockfile
RUN pnpm exec tooling check-release
```

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
4. Presets (`react`, `adonisjs`, `vitest`, `lingui`), asked when OXC or Knip is selected. They are pre-selected from the dependencies found in the root `package.json` and in the `package.json` of `apps/*` and `packages/*`: `react`, `react-dom`, `@types/react` or `@types/react-dom` for `react`, `vitest` for `vitest`, `@lingui/core` or `@lingui/react` for `lingui`, any `@adonisjs/*` package for `adonisjs`.
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

`.github/workflows/release.yml` runs the check, then `release-it`, in CI, and pushes the release with a deploy key. It runs from `main` only and expects the checks to have passed in the caller.

| Input                   | Default                           | Meaning                                                                                                                                                                                                 |
| ----------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `increment`             | required                          | `patch`, `minor`, `major`, or `prerelease` to continue the current prerelease series (`1.0.0-next.0` to `1.0.0-next.1`; it needs a `release-script` that passes `--preRelease`)                         |
| `release-script`        | `release`                         | `package.json` script that runs release-it                                                                                                                                                              |
| `pre-release-id`        | none                              | Pre-release identifier, for example `next`                                                                                                                                                              |
| `check-release-command` | `pnpm exec tooling check-release` | Command that fails when the release is unsafe                                                                                                                                                           |
| `node-version-file`     | `.node-version`                   | File that holds the Node version                                                                                                                                                                        |
| `release-environment`   | `release`                         | Environment of the caller repository that holds the deploy key                                                                                                                                          |
| `version-files`         | `package.json`                    | Space-separated files the release commit may change to bump the version                                                                                                                                 |
| `changelog-files`       | `CHANGELOG.md`                    | Space-separated Keep a Changelog files the release commit may roll                                                                                                                                      |
| `tag-prefix`            | `v`                               | Prefix of the tag name, before the version; pass an empty string for tags like `1.2.3`                                                                                                                  |
| `commit-message`        | `chore(release): ${version}`      | Message of the release commit, with `${version}` replaced by the new version (nothing is evaluated); set it to the `commitMessage` of your release-it config. It must render to a single printable line |

Outputs: `version`, `tag` (the tag created) and `sha` (the release commit, now at the head of `main`).

The required secret `release-deploy-key` is the private key of a deploy key with write access: store it as the environment secret `RELEASE_DEPLOY_KEY` and pass it by name.

A consumer `publish.yml` that calls it, pinned by commit SHA:

```yaml
name: Publish

on:
  workflow_dispatch:
    inputs:
      increment:
        type: choice
        options: [patch, minor, major, prerelease]
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
    uses: minimalstuff/tooling/.github/workflows/release.yml@<full commit SHA> # v0.12.0
    with:
      increment: ${{ inputs.increment }}
    secrets:
      release-deploy-key: ${{ secrets.RELEASE_DEPLOY_KEY }}
```

The caller grants `contents: write`, declares no `environment` on the calling job, and needs the environment `release` with the secret `RELEASE_DEPLOY_KEY`, the deploy key and the tag ruleset described in [Release a version](releasing.md#one-time-setup).

#### Two jobs, and why

release-it and its npm dependencies are third-party code. In a single job, that code could reach the deploy key, the only bypass actor of the tag ruleset: a dependency can append to `$GITHUB_PATH` (a fake `ssh-add` then receives the key on stdin), write `$GITHUB_ENV` (`BASH_ENV`, `LD_PRELOAD`) or plant `.git/hooks` and `.git/config`, then move tags or push to `main`. The workflow therefore has two jobs:

- `prepare` has no environment and no secret, and its token is `contents: read`. It installs with `--ignore-scripts`, runs the check and release-it with `--no-git.push --no-git.tag --no-github.release`, then ships the single release commit as the artifact `tooling-release-bundle` (a `git bundle`, kept 7 days).
- `publish` runs in the environment that holds the deploy key and uses only bash, git, jq, awk and gh: no Node, no pnpm, no npm. It treats the artifact as hostile. It fetches the one expected ref with object checks, then refuses anything but a version bump and a changelog roll: exactly one parent equal to the workflow commit; only modified regular files (no add, delete, rename, symlink, executable bit or submodule); every changed path listed in `version-files` or `changelog-files`; a strict semantic version, read from the root `package.json`; in version files, only the old version replaced by the new one (and nothing else in a `package.json`); in changelogs, only the `[Unreleased]` heading, the new dated heading and the `[Unreleased]` and version links to your repository. The new version must also match `increment`: from `0.11.0`, `minor` gives `0.12.0`, a pre-release part must look like `next.0`, and a prerelease promoted by `patch`, `minor` or `major` may keep its core (`1.0.0-next.3` to `1.0.0`). Links in changelogs may not contain `.` or `..` path segments. It never pushes the commit it received: it rebuilds it from the verified tree, with the parent set to the workflow commit, the message from `commit-message`, the bot as author and committer, and the dates of the received commit (checked as raw git dates), so the same bundle always gives the same commit. It never checks out the bundle's files, creates the annotated tag itself (`<tag-prefix><version>`, message `<repository name> <version>`), pushes `main` and the tag atomically with the deploy key (never forced), and creates the GitHub release with the `[Unreleased]` notes read from `CHANGELOG.md` at the workflow commit.

What it protects: the git history (a release can only add the one verified commit), the tags (an existing tag is never moved) and the deploy key (no third-party code runs next to it).

What it does not protect: the artifacts your own jobs build from the release commit (an npm package, a Docker image, a binary) still run third-party code, like any build. Keep their credentials out of the jobs that build, as `publish.yml` does with its `npm` environment. A dependency whose version equals the old version could also be bumped to the new one in `Cargo.toml` or `Cargo.lock`, so review lockfile changes of a release commit as usual; a `package.json` is stricter, as only its `version` may change. Changelog files must end with a newline, otherwise the roll is refused.

Release-it must not tag: the workflow passes `--no-git.tag`, and the tag settings of your release-it config (`git.tag`, `git.tagAnnotation`) are ignored. Keep `git.tagName` in step with `tag-prefix`, since the changelog links use it.

#### Re-running a failed release

Re-run the failed `publish` job from the Actions page: the bundle artifact of the same run is reused. Before pushing, the job lists the remote tag. If the tag does not exist, it pushes. If the tag is an annotated tag whose commit is the verified release commit and `main` already points at it, the push is skipped and only the missing GitHub release is created. Any other state (the tag exists on another commit, or `main` moved) fails and needs a manual look. The GitHub release is skipped when it already exists.

### Apps deployed from tags

Run the check in the Dockerfile, right after the install, so an image never builds with a patched or linked library:

```dockerfile
RUN pnpm install --frozen-lockfile
RUN pnpm exec tooling check-release
```

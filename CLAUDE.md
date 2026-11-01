# @minimalstuff/tooling

Public npm package: oxlint, oxfmt, Knip and EditorConfig presets, plus an interactive CLI that writes config files and installs packages in consumer projects.

## Verify

- `pnpm checks` (plural) runs typecheck, lint, format check, Knip, unit tests and build. `check` (singular) is the script the CLI generates in consumer projects, not a script of this repo.
- One test file: `pnpm vitest run <path>`.
- `pnpm test:package` installs the packed tarball into consumers with strict pnpm (`hoist: false`). It needs network and takes minutes: CI runs it, the release hook does not.
- Preset tests run oxlint and oxfmt on temp fixtures that symlink this repo's `node_modules` (`src/oxc/test_utils.ts`): run `pnpm install` first.

## Conventions

- Load `typescript-conventions`.
- Every user-visible change adds a line under `## [Unreleased]` in `CHANGELOG.md` in the same commit (hand-written Keep a Changelog).
- Before 1.0, a new or stricter `error` rule, a removed or changed export or option, or a new required peer is breaking: `!` in the commit, `**Breaking:**` in the CHANGELOG, a section in `docs/migrating.md`.
- Generated config files must pass `oxfmt --check` with the preset (`src/cli/generated_config_format.test.ts`), so generated strings stay single-quoted unless escaping requires double quotes.

## Decisions

- `@adonisjs/eslint-plugin` is an optional peer, not a dependency: with strict pnpm, oxlint cannot resolve a plugin nested in this package's dependencies.
- Publishing happens only through `.github/workflows/publish.yml` on a GitHub release (npm trusted publishing, provenance), never with a local `npm publish`. Prereleases go through `pnpm release:next`, never `pnpm release --preRelease` (it empties `[Unreleased]`, see `docs/releasing.md`).
- The repo lints and formats itself with its own presets imported from `src/`, so a preset change affects this repo's lint immediately.
- The CLI is interactive only and exits with code 1 without a TTY. Non-interactive flags were left out on purpose.

## Rejected

- A GitHub deployment environment to restrict publishing to `main`: deferred by the maintainer, risk accepted.

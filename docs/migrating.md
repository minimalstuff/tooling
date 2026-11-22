# Upgrade guides

[README](../README.md)

## Upgrade from 0.11 to 0.12

In 0.x a minor bump is breaking, so `^0.11.0` never resolves to 0.12: upgrade explicitly. The release workflow is a reusable workflow you pin by commit SHA, so move your pin to the 0.12.0 commit.

```bash
pnpm add -D @minimalstuff/tooling@^0.12.0
```

The reusable `release.yml` is now split in two jobs, so release-it and its npm dependencies never run next to the deploy key (see [Reusable release workflow](cli.md#reusable-release-workflow)). Inputs and the secret keep their names, with these changes:

- The `release-environment` environment now sits on the `publish` job, not on the whole workflow. Nothing changes in your repository settings: the environment and its `RELEASE_DEPLOY_KEY` secret stay the same. The `prepare` job, which runs release-it, has no environment and no secret.
- release-it no longer tags: the workflow passes `--no-git.tag`, creates the annotated tag itself in the `publish` job (message `<repository name> <version>`) and ignores the tag annotation settings of your release-it config. Keep `git.tagName` in step with the new input `tag-prefix`.
- The release commit is verified before it is pushed: it may only bump the version and roll the changelogs. A file that the release commit changes must be listed in the new inputs `version-files` (default `package.json`) or `changelog-files` (default `CHANGELOG.md`), separated by spaces. In a version file, only the old version may be replaced by the new one. A release that touches any other file, or any other line, now fails.
- New input `tag-prefix` (default `v`). Pass `''` when your tags have no prefix.
- New input `commit-message` (default `chore(release): ${version}`). The `publish` job no longer pushes the commit made in `prepare`: it rebuilds it from the verified tree with this message, the bot as author and committer, and the same dates, so set it to the `commitMessage` of your release-it config. The new version must also match `increment`.
- New output `sha`: the release commit, now at the head of `main`. Check out `needs.release.outputs.sha` instead of the tag in the jobs that build the release.
- The changelogs must end with a newline, and `[Unreleased]` entries are read from `CHANGELOG.md` at the commit that started the workflow.

Per project:

- `commit-message` per project: `streamdeck-plugins` uses the default; `vts-pwa`, `takumi` and `ui-minimalstuff` pass `chore: release v${version}`; `devslot` passes `chore(release): v${version}`.
- Projects that only bump the root `package.json` and `CHANGELOG.md` (such as `streamdeck-plugins`) need no input.
- A project that rolls a second changelog in a release-it hook (such as `vts-pwa` with `CHANGELOG.fr.md`) passes `changelog-files: CHANGELOG.md CHANGELOG.fr.md`.
- A project whose bumper also changes another `package.json` (such as `takumi` with `apps/api/package.json`) passes `version-files: package.json apps/api/package.json`. The bumper must keep every other line of that file as it is (same indentation, same final newline).
- A project whose tags have no prefix (such as `ui-minimalstuff`) passes `tag-prefix: ''`.
- A Rust project that also bumps `Cargo.toml` and `Cargo.lock` (such as `devslot`) passes `version-files: package.json Cargo.toml Cargo.lock`.

## Upgrade from 0.7 to 0.8

In 0.x a minor bump is breaking, so `^0.7.0` never resolves to 0.8: upgrade explicitly.

```bash
pnpm add -D @minimalstuff/tooling@^0.8.0
```

- AdonisJS projects (`adonisjs: true`) must install the plugin themselves: `pnpm add -D @adonisjs/eslint-plugin`. It is an optional peer dependency instead of a dependency of this package.
- The base oxlint preset enables the `promise` plugin and the async rules listed in [oxlint preset](presets.md#oxlint-preset): the error-level ones may surface additional errors.
- Relative imports are reported by default (`subpathImports`). Either declare `"imports": { "#*": "./src/*" }` in `package.json` and rewrite imports as `#folder/file.ts`, or opt out with `minimalstuffPreset({ subpathImports: false })`. The rule has no autofix.

## Upgrade from 0.6 to 0.7

In 0.x a minor bump is breaking, so `^0.6.0` never resolves to 0.7: upgrade explicitly.

```bash
pnpm add -D @minimalstuff/tooling@^0.7.0 oxlint@latest oxfmt@latest oxlint-tsgolint@latest
```

Requirements changed:

- Node >= 26.
- Peers: `oxlint >= 1.89.0`, `oxfmt >= 0.74.0`, `oxlint-tsgolint >= 7.0.2004`.

oxlint: the preset returns the root config instead of being passed to `extends`.

```ts
// before
export default defineConfig({
	ignorePatterns: [...ADONISJS_DEFAULT_IGNORE_PATTERNS, 'tmp/**'],
	extends: [minimalstuffPreset({ react: true, adonisjs: true })],
	rules: { 'no-console': 'warn' },
});

// after
export default minimalstuffPreset({
	react: true,
	adonisjs: true,
	ignorePatterns: ['tmp/**'],
	rules: { 'no-console': 'warn' },
});
```

oxfmt: `OXFMT_DEFAULT_IGNORE_PATTERNS` and `ADONISJS_DEFAULT_IGNORE_PATTERNS` are no longer exported.

```ts
// before
export default minimalstuffPreset({
	ignorePatterns: [
		...OXFMT_DEFAULT_IGNORE_PATTERNS,
		...ADONISJS_DEFAULT_IGNORE_PATTERNS,
	],
});

// after
export default minimalstuffPreset({ adonisjs: true });
```

Other changes:

- The `perfectionist` option is removed. Imports are sorted alphabetically by oxfmt: run `pnpm format` once.
- Remove the ignore patterns that are defaults from your configs.
- The `eslint-plugin-perfectionist` dependency is no longer needed.
- Correctness rules are errors and additional type-aware rules are enabled (see [oxlint preset](presets.md#oxlint-preset)): `pnpm lint` may fail where it passed before.
- The CLI only adds missing scripts, so update existing ones by hand: drop `--fix-dangerously` from `lint:fix` and replace `format: "pnpm lint:fix; oxfmt ."` with `format: "oxfmt && oxlint --fix"` (see [CLI scripts](cli.md#scripts)).
- Optional: add Knip (see [Knip preset](presets.md#knip-preset)).

# @minimalstuff/tooling

## Features

- [OXC](https://oxc.rs/) presets: oxlint and oxfmt
- EditorConfig preset
- CLI for quick project setup

## Requirements

- Node >= 26
- `oxlint`, `oxfmt` and `oxlint-tsgolint` (optional peer dependencies, for the OXC presets)

> [!IMPORTANT]
> New/updated rules will not be considered as breaking changes. Only API changes will be considered as breaking changes.

## Setup

### CLI

Run this command in your project root directory:

```bash
pnpm dlx @minimalstuff/tooling@latest
```

The CLI lets you pick the tools to set up: EditorConfig, OXC and VSCode settings. For OXC, it lets you pick the presets (`react`, `adonisjs`, `vitest`), pre-selected from the dependencies it detects. It asks before overwriting an existing config file and only adds the `package.json` scripts that do not exist yet:

| Script         | Command                                            |
| -------------- | -------------------------------------------------- |
| `lint`         | `oxlint`                                           |
| `lint:fix`     | `oxlint --fix`                                     |
| `format`       | `oxfmt && oxlint --fix`                            |
| `format:check` | `oxfmt --check`                                    |
| `typecheck`    | `tsc --noEmit`                                     |
| `check`        | `pnpm lint && pnpm format:check && pnpm typecheck` |

### Manual install

```bash
pnpm add -D oxlint oxfmt oxlint-tsgolint @minimalstuff/tooling
```

## oxlint

```ts
// oxlint.config.ts
import { minimalstuffPreset } from '@minimalstuff/tooling/oxc/lint';

export default minimalstuffPreset({
	react: true,
	ignorePatterns: ['tmp/**'],
	rules: {
		'no-console': 'warn',
	},
});
```

`minimalstuffPreset` returns the root config. Any oxlint option (`rules`, `overrides`, `plugins`, `extends`, ...) can be passed next to the preset options:

| Option     | Type      | Default | Enables                                                                                                   |
| ---------- | --------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `react`    | `boolean` | `false` | `react` and `jsx-a11y` plugins, `react/rules-of-hooks` and `react/only-export-components`                 |
| `adonisjs` | `boolean` | `false` | `@adonisjs/eslint-plugin` lazy import rules, Lucid-aware `no-floating-promises`, AdonisJS ignore patterns |
| `vitest`   | `boolean` | `false` | `vitest` plugin                                                                                           |

With both `adonisjs` and `react`, the Inertia rules (`no-backend-import-in-frontend`, `prefer-adonisjs-inertia-link`, `prefer-adonisjs-inertia-form`) are enabled on `**/inertia/**/*.{ts,tsx}`.

The base preset enables the `typescript`, `unicorn` and `oxc` plugins, the `correctness` category as `error`, and type-aware linting with type checking (`typeAware`, `typeCheck`) with a set of strict `typescript/*` rules.

### Merge semantics

- `rules`: yours override the preset's
- `overrides`: yours come after the preset's
- `plugins`, `jsPlugins`: yours are added to the preset's
- `extends`: yours come after the preset's
- `ignorePatterns`: the defaults are kept and yours are appended

### Default ignore patterns

- Always: `**/node_modules/**`, `**/dist/**`, `**/build/**`, `**/routeTree.gen.ts`, `**/*.yml`, `**/*.yaml`
- With `adonisjs`: `**/.adonisjs/**`, `**/bin/*`, `**/database/schema.ts`

## oxfmt

```ts
// oxfmt.config.ts
import { minimalstuffPreset } from '@minimalstuff/tooling/oxc/fmt';

export default minimalstuffPreset({ printWidth: 100 });
```

Defaults: `printWidth: 80`, `tabWidth: 2`, `useTabs: true`, `semi: true`, `singleQuote: true`, `quoteProps: 'as-needed'`, `bracketSpacing: true`, `arrowParens: 'always'`, `trailingComma: 'es5'`, `htmlWhitespaceSensitivity: 'ignore'`.

Imports are sorted natively with `sortImports`, alphabetically, in three groups separated by a blank line: side effects, then `builtin` and `external`, then `@/` and `~/` internal imports and relative imports.

| Option     | Type      | Default | Description                      |
| ---------- | --------- | ------- | -------------------------------- |
| `adonisjs` | `boolean` | `false` | Add the AdonisJS ignore patterns |

Any other oxfmt option overrides the defaults. `ignorePatterns` are appended to the defaults (the oxlint ones plus `**/CHANGELOG.md`), never replaced.

## Migrating from 0.6

In 0.x a minor bump is breaking, so `^0.6.0` never resolves to 0.7: upgrade explicitly.

```bash
pnpm add -D @minimalstuff/tooling@^0.7.0 oxlint@latest oxfmt@latest oxlint-tsgolint@latest
```

Requirements changed:

- Node >= 26.
- Peers: `oxlint >= 1.89.0`, `oxfmt >= 0.74.0`, `oxlint-tsgolint >= 7.0.2004`.

oxlint: the preset now returns the root config instead of being passed to `extends`.

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

- The `perfectionist` option is removed. Imports are now sorted alphabetically by oxfmt: run `pnpm format` once.
- Remove the ignore patterns that are now defaults from your configs.
- The `eslint-plugin-perfectionist` dependency is no longer needed.
- Correctness rules are now errors and new type-aware rules are enabled (see [oxlint](#oxlint)): `pnpm lint` may fail where it passed before.
- The CLI only adds missing scripts, so update existing ones by hand: drop `--fix-dangerously` from `lint:fix` and replace `format: "pnpm lint:fix; oxfmt ."` with `format: "oxfmt && oxlint --fix"` (see [CLI](#cli)).

## Publishing

Add a repository secret named `NPM_TOKEN` (**Settings > Secrets and variables > Actions**) holding an automation token from [npmjs.com/access-tokens](https://www.npmjs.com/access-tokens) with publish rights on `@minimalstuff/tooling`.

---

> source: https://github.com/Julien-R44/tooling

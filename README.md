# @minimalstuff/tooling

## Features

- [OXC](https://oxc.rs/) presets: oxlint and oxfmt
- [Knip](https://knip.dev/) preset, with AdonisJS support
- EditorConfig preset
- CLI for quick project setup

## Requirements

- Node >= 26
- `oxlint`, `oxfmt` and `oxlint-tsgolint` (optional peer dependencies, for the OXC presets)
- `knip` >= 6.42.1 (optional peer dependency, for the Knip preset)

> [!IMPORTANT]
> New/updated rules will not be considered as breaking changes. Only API changes will be considered as breaking changes.

## Setup

### CLI

Run this command in your project root directory:

```bash
pnpm dlx @minimalstuff/tooling@latest
```

The CLI lets you pick the tools to set up: EditorConfig, OXC, Knip and VSCode settings. For OXC and Knip, it lets you pick the presets (`react`, `adonisjs`, `vitest`) once, pre-selected from the dependencies it detects. Knip is pre-selected unless a knip config already exists. When `adonisjs` is kept, the generated `knip.ts` targets the root (`adonisjs: true`) or the workspaces (`apps/*`, `packages/*`) whose `package.json` has an `@adonisjs/*` dependency. It asks before overwriting an existing config file and only adds the `package.json` scripts that do not exist yet:

| Script         | Command                                            |
| -------------- | -------------------------------------------------- |
| `lint`         | `oxlint`                                           |
| `lint:fix`     | `oxlint --fix`                                     |
| `format`       | `oxfmt && oxlint --fix`                            |
| `format:check` | `oxfmt --check`                                    |
| `typecheck`    | `tsc --noEmit`                                     |
| `knip`         | `knip`                                             |
| `check`        | `pnpm lint && pnpm format:check && pnpm typecheck` |

With Knip and OXC selected, `check` also runs `pnpm knip` at the end. Knip alone only adds the `knip` script.

### Manual install

```bash
pnpm add -D oxlint oxfmt oxlint-tsgolint @minimalstuff/tooling
# optional, for the Knip preset
pnpm add -D knip
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

## knip

```ts
// knip.ts
import { minimalstuffPreset } from '@minimalstuff/tooling/knip';

export default minimalstuffPreset({ adonisjs: true });
```

Monorepo, with the AdonisJS app(s) in workspaces:

```ts
export default minimalstuffPreset({ adonisjs: ['apps/webapp'] });
```

`minimalstuffPreset` returns the root config. Any knip option (`entry`, `project`, `ignore`, `ignoreDependencies`, `workspaces`, ...) can be passed next to the preset option. Without `adonisjs`, it returns your config as is: knip's built-in plugins (vite, vitest, playwright, tsdown, oxlint, ...) already cover most setups.

| Option     | Type                           | Default | Description                                                                                                                                                |
| ---------- | ------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `adonisjs` | `boolean \| readonly string[]` | `false` | `true` applies the AdonisJS config to the root workspace. A list of paths applies it to each of those workspaces (under `workspaces[path]`, monorepo case) |

Knip has no AdonisJS or Japa plugin, so everything Adonis loads by convention would be reported as unused. The AdonisJS config declares:

- `entry`: `adonisrc.ts`, `ace.js`, `bin/*.ts`, `start/**`, `config/**`, `providers/**`, `commands/**`, `database/{migrations,seeders,factories}/**`, `tests/bootstrap.ts`, Japa specs (`tests/**/*.spec.{ts,js}`, `app/**/*.spec.{ts,js}`), and the Inertia files (`inertia/{app,ssr}.{ts,tsx}`, `inertia/app/{app,ssr}.{ts,tsx}`, `inertia/pages/**/*.{ts,tsx}`, pages are resolved by name at runtime)
- `project`: `**/*.{ts,tsx,js}`
- `ignore`: `.adonisjs/**` (generated), `database/schema.ts` (generated by Lucid)
- `ignoreDependencies`: `pg`, `mysql2`, `better-sqlite3`, `sqlite3` (database drivers only referenced by name in `config/database.ts`), `pino-pretty` (logger transport referenced by name), `hot-hook` (only referenced in `package.json`)

### Merge semantics

For the targeted workspace(s):

- arrays (`entry`, `project`, `ignore`, `ignoreDependencies`, ...): yours are appended to the preset's (a single string is accepted)
- other keys (booleans, objects such as plugin configs): yours win

With `adonisjs: true`, the preset is merged into the root keys. If you define `workspaces['.']` yourself, knip ignores the root keys: use `adonisjs: ['.']` instead. With a list of paths, the root keys are left untouched and each listed workspace gets the preset merged with its own `workspaces[path]` entry.

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
- Optional: add Knip (see [knip](#knip)).

## Publishing

Publishing uses npm [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC), no token needed. On npmjs.com, `@minimalstuff/tooling` > **Settings > Trusted publishing** must list GitHub Actions with organization `minimalstuff`, repository `tooling` and workflow `publish.yml`. Publishing a GitHub release triggers the workflow.

---

> source: https://github.com/Julien-R44/tooling

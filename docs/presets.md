# Presets reference

[README](../README.md)

## oxlint preset

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

| Option           | Type                                       | Default | Enables                                                                                                                                                                                                     |
| ---------------- | ------------------------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react`          | `boolean`                                  | `false` | `react` and `jsx-a11y` plugins, `react/rules-of-hooks` and `react/only-export-components`                                                                                                                   |
| `adonisjs`       | `boolean`                                  | `false` | `@adonisjs/eslint-plugin` lazy import rules, Lucid-aware `no-floating-promises`, AdonisJS ignore patterns (needs `@adonisjs/eslint-plugin` as a dev dependency, the CLI installs it)                        |
| `vitest`         | `boolean`                                  | `false` | `vitest` plugin                                                                                                                                                                                             |
| `lingui`         | `boolean \| { allowedStrings?: string[] }` | `false` | `react/jsx-no-literals` refusing visible JSX text and user-facing attribute strings that bypass Lingui; `allowedStrings` adds strings that never need translating (brand names...) to the default allowlist |
| `subpathImports` | `boolean`                                  | `true`  | `no-restricted-imports` on relative specifiers (`./*`, `../*`), so imports go through Node subpath imports (`"imports": { "#*": "./src/*" }` in `package.json`). Set `false` to allow relative imports      |

With `react`, `react/only-export-components` is off in test files (`**/*.{test,spec}.{ts,tsx,js,jsx}` and `**/tests/**`): Fast Refresh never applies there, so test helpers can re-export a library next to a custom `render`.

With `adonisjs`, `typescript/consistent-type-imports` is off in `**/app/**`, `**/commands/**` and `**/providers/**`: `@inject()` constructor injection needs the injected class as a value import (`emitDecoratorMetadata`), and the rule's autofix would turn it into a type import and break injection at runtime.

With both `adonisjs` and `react`, the Inertia rules (`no-backend-import-in-frontend`, `prefer-adonisjs-inertia-link`, `prefer-adonisjs-inertia-form`) are enabled on `**/inertia/**/*.{ts,tsx}`.

With `lingui`, `react/jsx-no-literals` reports literal JSX text and literal strings in the attributes that reach the user: `aria-label`, `aria-description`, `aria-roledescription`, `aria-valuetext`, `title`, `alt`, `placeholder`, plus the text props of `@minimalstuff/ui` components (`label`, `description`, `error`, `text`, `message`, `closeLabel`, `clearLabel`, `menuLabel`, `requiredLabel`, `noResultsText`, `searchPlaceholder`). Any other attribute (`className`, `type`, `id`...) is not text. `Trans` and `Kbd` children are allowed (the message itself, key names), and so are strings identical in every locale: the empty string (decorative `alt=""`), `·`, `•`, `…`, `%`, `(`, `)`, `,`, `/`, `:`, `|` and `-`. The rule is off in test files. It does not catch a wrapped literal such as `{'text'}`: oxlint's `noStrings` would flag every attribute literal, `className` included, so it stays off.

The base preset enables the `typescript`, `unicorn` and `oxc` plugins, the `correctness` category as `error`, and type-aware linting with type checking (`typeAware`, `typeCheck`) with a set of strict `typescript/*` rules.

It also enables the `promise` plugin and these async rules:

- `no-await-in-loop`: `warn`, turned off for test files (`**/*.{test,spec}.{ts,tsx,js,jsx}` and `**/tests/**`)
- `error`: `promise/param-names`, `promise/no-return-in-finally`, `promise/no-multiple-resolved`, `promise/no-new-statics`, `promise/valid-params`
- `warn`: `promise/no-nesting`

### Merge semantics

- `rules`: yours override the preset's
- `overrides`: yours come after the preset's
- `plugins`, `jsPlugins`: yours are added to the preset's
- `extends`: yours come after the preset's
- `ignorePatterns`: the defaults are kept and yours are appended

### Default ignore patterns

- Always: `**/node_modules/**`, `**/dist/**`, `**/build/**`, `**/routeTree.gen.ts`, `**/*.yml`, `**/*.yaml`
- With `adonisjs`: `**/.adonisjs/**`, `**/bin/*`, `**/database/schema.ts`

## oxfmt preset

```ts
// oxfmt.config.ts
import { minimalstuffPreset } from '@minimalstuff/tooling/oxc/fmt';

export default minimalstuffPreset({ printWidth: 100 });
```

Defaults: `printWidth: 80`, `tabWidth: 2`, `useTabs: true`, `semi: true`, `singleQuote: true`, `quoteProps: 'as-needed'`, `bracketSpacing: true`, `arrowParens: 'always'`, `trailingComma: 'es5'`, `htmlWhitespaceSensitivity: 'ignore'`.

Imports are sorted natively with `sortImports`, alphabetically, in three groups separated by a blank line: side effects, then `builtin` and `external`, then internal imports (`@/`, `~/` and `#` subpath imports) and relative imports.

| Option     | Type      | Default | Description                      |
| ---------- | --------- | ------- | -------------------------------- |
| `adonisjs` | `boolean` | `false` | Add the AdonisJS ignore patterns |

Any other oxfmt option overrides the defaults. `ignorePatterns` are appended to the defaults (the oxlint ones plus `**/CHANGELOG.md`), never replaced.

## Knip preset

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

- `entry`: `adonisrc.ts`, `ace.js`, `bin/*.ts`, `start/**/*.ts`, `config/**/*.ts`, `providers/**/*.ts`, `commands/**/*.ts`, `database/migrations/**/*.ts`, `database/seeders/**/*.ts`, `database/factories/**/*.ts`, `tests/bootstrap.ts`, Japa specs (`tests/**/*.spec.{ts,js}`, `app/**/*.spec.{ts,js}`), and the Inertia files (`inertia/{app,ssr}.{ts,tsx}`, `inertia/app/{app,ssr}.{ts,tsx}`, `inertia/pages/**/*.{ts,tsx}`, pages are resolved by name at runtime)
- `project`: `**/*.{ts,tsx,js}`
- `ignore`: `.adonisjs/**` (generated), `database/schema.ts` (generated by Lucid)
- `ignoreDependencies`: `pg`, `mysql2`, `better-sqlite3`, `sqlite3` (database drivers only referenced by name in `config/database.ts`), `pino-pretty` (logger transport referenced by name), `hot-hook` (only referenced in `package.json`)

### Merge semantics

For the targeted workspace(s):

- arrays (`entry`, `project`, `ignore`, `ignoreDependencies`, ...): yours are appended to the preset's (a single string is accepted)
- other keys (booleans, objects such as plugin configs): yours win

With `adonisjs: true`, the preset is merged into the root keys. If you define `workspaces['.']` yourself, knip ignores the root keys: use `adonisjs: ['.']` instead. With a list of paths, the root keys are left untouched and each listed workspace gets the preset merged with its own `workspaces[path]` entry.

## EditorConfig preset

The preset is the `@minimalstuff/tooling/editorconfig` export, which resolves to the `preset/.editorconfig` file of the package. The CLI copies it to `.editorconfig`, or copy it yourself:

```bash
cp node_modules/@minimalstuff/tooling/preset/.editorconfig .editorconfig
```

# Upgrade guides

[README](../README.md)

## Upgrade from 0.7 to 0.8

In 0.x a minor bump is breaking, so `^0.7.0` never resolves to 0.8: upgrade explicitly.

```bash
pnpm add -D @minimalstuff/tooling@^0.8.0
```

- AdonisJS projects (`adonisjs: true`) must install the plugin themselves: `pnpm add -D @adonisjs/eslint-plugin`. It is an optional peer dependency instead of a dependency of this package.
- The base oxlint preset enables the `promise` plugin and the async rules listed in [oxlint preset](presets.md#oxlint-preset): the error-level ones may surface additional errors.

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

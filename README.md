# Minimalstuff Tooling

Shared tooling configs: EditorConfig, OXC (`oxlint` + `oxfmt`), and `release-it` with Conventional Changelog.

## EditorConfig

Canonical file: `preset/.editorconfig` (published as `@minimalstuff/tooling/editorconfig`).

After `pnpm add -D @minimalstuff/tooling`:

```bash
cp node_modules/@minimalstuff/tooling/preset/.editorconfig .editorconfig
```

Or run `pnpm dlx @minimalstuff/tooling` (after the package is **published** to npm) or `pnpm exec minimalstuff-tooling` when it is installed as a dev dependency.

### Before publishing: `pnpm dlx` and npm 404

`pnpm dlx @minimalstuff/tooling` always fetches from the **npm registry**. Until you publish the scope, it will return **404**.

Use one of these instead:

```bash
pnpm add -D file:/absolute/path/to/minimalstuff-tooling
pnpm exec minimalstuff-tooling
```

Or from anywhere, point `dlx` at the local folder (path must contain a `package.json`):

```bash
pnpm dlx /absolute/path/to/minimalstuff-tooling
```

Or pack once and run the tarball:

```bash
cd /path/to/minimalstuff-tooling && pnpm pack
pnpm dlx /path/to/minimalstuff-tooling/minimalstuff-tooling-0.0.1.tgz
```

## OXC (oxlint + oxfmt)

### `oxlint.config.js`

```js
import {defineConfig} from 'oxlint'
import {minimalstuffPreset} from '@minimalstuff/tooling/oxc/lint'

export default defineConfig({
	extends: [minimalstuffPreset()],
})
```

### `oxfmt.config.js`

```js
import {minimalstuffPreset} from '@minimalstuff/tooling/oxc/fmt'

export default minimalstuffPreset()
```

## `release-it` (Conventional Changelog)

This package configures `release-it` with the `conventionalcommits` preset.

## Build and publish

The published package is **compiled JavaScript** in `dist/` (Node cannot run the published `bin` as raw TypeScript). `npm publish` runs `prepublishOnly`, which executes `pnpm run build`.

Maintainers: `pnpm lint` and `pnpm format` run a build first so local `oxlint.config.ts` / `oxfmt.config.ts` can import `./dist/oxc/*.js`. For a quick check on source only: `pnpm typecheck`.

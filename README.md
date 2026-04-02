## Features

- Shared presets for [OXC](https://oxc.rs/) tools (oxlint + oxfmt)
- TypeScript configuration presets
- CLI for quick project setup

## Usage

> [!IMPORTANT]
> New/updated rules will not be considered as breaking changes. Only API changes will be considered as breaking changes.

### CLI installation

Just run this command in your project root directory:

```bash
pnpm dlx @minimalstuff/tooling@latest
```

### Manual install

```bash
pnpm add -D oxlint oxfmt @minimalstuff/tooling
```

### OXC (oxlint + oxfmt)

#### oxlint

```ts
// oxlint.config.ts
import { defineConfig } from "oxlint";
import { minimalstuffPreset } from "@minimalstuff/tooling/oxc/lint";

export default defineConfig({
  extends: [minimalstuffPreset()],
});
```

Options:

| Option          | Type      | Default | Description                             |
| --------------- | --------- | ------- | --------------------------------------- |
| `react`         | `boolean` | `false` | Enable React-specific oxlint plugins    |
| `adonisjs`      | `boolean` | `false` | Enable AdonisJS-specific rules          |
| `perfectionist` | `boolean` | `false` | Enable import sorting via perfectionist |

```ts
export default defineConfig({
  extends: [
    minimalstuffPreset({ react: true, adonisjs: true, perfectionist: true }),
  ],
});
```

#### oxfmt

```ts
// oxfmt.config.ts
import { minimalstuffPreset } from "@minimalstuff/tooling/oxc/fmt";

export default minimalstuffPreset();
```

You can override any option:

```ts
export default minimalstuffPreset({ printWidth: 120, semi: true });
```

Defaults: `printWidth: 100`, `semi: false`, `singleQuote: true`, `trailingComma: 'all'`, `arrowParens: 'avoid'`.

#### Scripts

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "format": "oxfmt --write ."
  }
}
```

### Tsconfig

Node (ESM):

```json
{
  "extends": "@minimalstuff/tooling/tsconfigs/tsconfig.node",
  "compilerOptions": {
    "rootDir": "./",
    "outDir": "./build"
  }
}
```

Node Next (ESM + `ts` extensions):

```json
{
  "extends": "@minimalstuff/tooling/tsconfigs/tsconfig.node-next",
  "compilerOptions": {
    "rootDir": "./",
    "outDir": "./build"
  }
}
```

React (TSX, bundler resolution):

```json
{
  "extends": "@minimalstuff/tooling/tsconfigs/tsconfig.react",
  "compilerOptions": {
    "rootDir": "./",
    "outDir": "./build"
  }
}
```

### Prerequisites

1. **NPM token**
   Create an automation token at [npmjs.com/access-tokens](https://www.npmjs.com/access-tokens) (scope: package publish for `@minimalstuff/ui`).

2. **Repository secret**
   In the repo: **Settings → Secrets and variables → Actions**. Add a secret named `NPM_TOKEN` with the token value.

---

> source: https://github.com/Julien-R44/tooling

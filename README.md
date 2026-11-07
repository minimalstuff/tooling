# @minimalstuff/tooling

Shared tooling configs: EditorConfig, OXC (oxlint + oxfmt), Knip. A CLI sets them up in a project.

## Requirements

- Node >= 26
- `oxlint` >= 1.89.0, `oxfmt` >= 0.74.0 and `oxlint-tsgolint` >= 7.0.2004 (optional peer dependencies, for the OXC presets)
- `knip` >= 6.42.1 (optional peer dependency, for the Knip preset)
- `@adonisjs/eslint-plugin` ^2.2.2 (optional peer dependency, needed with `adonisjs: true` in the oxlint preset; the CLI installs it)

## Versioning

> [!IMPORTANT]
> Removing or changing an export or option is a breaking change. Before 1.0, new or stricter `error`-level rules and new required peer dependencies are breaking too: they ship in a minor release, which `^0.x` ranges never pick up automatically. New `warn`-level rules and relaxed rules are not breaking.

## Set up a project

### With the CLI

Run this command from the project root, in an interactive terminal:

```bash
pnpm dlx @minimalstuff/tooling@latest
```

The CLI asks which tools to set up (EditorConfig, OXC, Knip), offers VS Code settings when OXC is selected, and asks for presets (`react`, `adonisjs`, `vitest`) pre-selected from your dependencies. It asks before overwriting a file and only adds the `package.json` scripts that are missing. It then installs the packages once as devDependencies with the detected package manager. See the [CLI reference](docs/cli.md) for details.

### Block releases that ship a patched or linked `@minimalstuff/*` package

`pnpm exec tooling check-release` reads `pnpm-lock.yaml` and exits with code 1 when a `@minimalstuff/*` package is patched (`pnpm patch`) or linked from outside the repository (`link:`, `file:`). It never prompts, so it runs in CI. The reusable workflow `.github/workflows/release.yml` runs it before cutting a release. See the [CLI reference](docs/cli.md#check-release).

### Manually

```bash
pnpm add -D oxlint oxfmt oxlint-tsgolint @minimalstuff/tooling
# optional, for the AdonisJS oxlint preset
pnpm add -D @adonisjs/eslint-plugin
# optional, for the Knip preset
pnpm add -D knip
```

```ts
// oxlint.config.ts
import { minimalstuffPreset } from '@minimalstuff/tooling/oxc/lint';

export default minimalstuffPreset({ react: true });
```

```ts
// oxfmt.config.ts
import { minimalstuffPreset } from '@minimalstuff/tooling/oxc/fmt';

export default minimalstuffPreset();
```

```ts
// knip.ts
import { minimalstuffPreset } from '@minimalstuff/tooling/knip';

export default minimalstuffPreset();
```

```bash
cp node_modules/@minimalstuff/tooling/preset/.editorconfig .editorconfig
```

See the [presets reference](docs/presets.md) for the options.

## Develop

```bash
pnpm install
pnpm checks
```

`pnpm checks` runs the typecheck, lint, format check, Knip, unit tests and build. `pnpm test:package` installs the packed tarball into throwaway consumer projects with strict pnpm: it needs network access and runs in CI.

## Documentation

- [CLI reference](docs/cli.md)
- [Presets reference](docs/presets.md)
- [Upgrade guides](docs/migrating.md)
- [Release a version](docs/releasing.md) (for maintainers)
- [Changelog](CHANGELOG.md)
- [Issues](https://github.com/minimalstuff/tooling/issues)

## License

[MIT](LICENSE)

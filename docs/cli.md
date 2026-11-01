# CLI reference

[README](../README.md)

```bash
pnpm dlx @minimalstuff/tooling@latest
```

Run the command from the project root. Without an interactive terminal, the CLI prints a message and exits with code 1. Cancelling (Ctrl+C or Esc) exits with code 130. Answering No to the first question exits with code 0 without changes.

## Questions

In order:

1. Confirmation of the current directory.
2. Tools: EditorConfig, OXC, Knip. A config already present in the current directory or the git root is labelled "(already exists)", and EditorConfig and Knip are then not pre-selected.
3. VS Code settings, asked only when OXC is selected. Adds `oxc.typeAware` and `editor.defaultFormatter` to `.vscode/settings.json` and keeps existing keys.
4. Presets (`react`, `adonisjs`, `vitest`), asked when OXC or Knip is selected. They are pre-selected from the dependencies found in the root `package.json` and in the `package.json` of `apps/*` and `packages/*`: `react`, `react-dom`, `@types/react` or `@types/react-dom` for `react`, `vitest` for `vitest`, any `@adonisjs/*` package for `adonisjs`.
5. Overwrite confirmation for each existing file.

## Files written

| File                    | Written when                          |
| ----------------------- | ------------------------------------- |
| `.editorconfig`         | EditorConfig is selected              |
| `oxlint.config.ts`      | OXC is selected                       |
| `oxfmt.config.ts`       | OXC is selected                       |
| `knip.ts`               | Knip is selected                      |
| `.vscode/settings.json` | OXC and VS Code settings are selected |

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

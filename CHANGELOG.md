# Changelog

## [0.7.0](https://github.com/minimalstuff/tooling/compare/v0.6.0...v0.7.0) (2026-10-22)

### ⚠ BREAKING CHANGES

* **oxc:** minimalstuffPreset now returns the root config instead
  of an extends entry, the *_IGNORE_PATTERNS exports and the perfectionist
  option are removed. See "Migrating from 0.6" in the README.
* Node >= 26 is required, along with oxlint >= 1.89.0,
  oxfmt >= 0.74.0 and oxlint-tsgolint >= 7.0.2004.

### Features

* **cli:** pick presets, keep existing scripts and confirm overwrites ([f1a8a70](https://github.com/minimalstuff/tooling/commit/f1a8a709fcf20036abf44b09be9628fda29a1d72))
* **knip:** add Knip preset and CLI support ([9d12043](https://github.com/minimalstuff/tooling/commit/9d1204375ebc2b1a0dc81d4a9e6c5e59be2b1153))
* **oxc:** return the root config from presets ([014e364](https://github.com/minimalstuff/tooling/commit/014e364fce33d6e0b755a6ac5e6829503708905b))

### Bug Fixes

* **cli:** generate preset configs that pass oxfmt --check ([fd68e22](https://github.com/minimalstuff/tooling/commit/fd68e22a85facc116e0c5bdbda898b16a96ff84f))
* **editorconfig:** indent YAML files with spaces ([0bea045](https://github.com/minimalstuff/tooling/commit/0bea0455817ae936e5affa85369e11b9099c3c64))

### Miscellaneous Chores

* migrate to Node 26, pnpm 12 and TypeScript 7 ([7463789](https://github.com/minimalstuff/tooling/commit/7463789574938c055b42bdc4627b9626a0938126))

## [0.6.0](https://github.com/minimalstuff/tooling/compare/v0.5.0...v0.6.0) (2026-05-11)

### Features

* add 'vscode' to ConfigTool and update related settings handling ([b29ad03](https://github.com/minimalstuff/tooling/commit/b29ad03a6400d9283ccd303f16e3382cf85b5998))
* **cli:** skip pre-selecting tools with existing configs at repo root ([1abfb5e](https://github.com/minimalstuff/tooling/commit/1abfb5e78c3a7392f0e5c29f082e5e4a22160c14))

## [0.5.0](https://github.com/minimalstuff/tooling/compare/v0.4.0...v0.5.0) (2026-04-26)

### Features

* add type detection for AdonisJS and React ([2eb51a2](https://github.com/minimalstuff/tooling/commit/2eb51a279f066376bb54fb8a5b8512b56d25300c))
* enable perfectionist import sorting by default in minimalstuffPreset ([42d67ff](https://github.com/minimalstuff/tooling/commit/42d67ff7e5384abb4d68d9b51426972f242668c4))

## [0.4.0](https://github.com/minimalstuff/tooling/compare/v0.3.0...v0.4.0) (2026-04-26)

### Features

* add AdonisJS default ignore patterns to formatting presets ([6f8c67b](https://github.com/minimalstuff/tooling/commit/6f8c67bc8f377ef8e100de29f9dd2c20897d8f71))
* add scripts section to user package.json for improved project management ([e6928b5](https://github.com/minimalstuff/tooling/commit/e6928b5eed92212ae78b6cff64e0a9cb47c10ba2))
* enhance linting configuration with AdonisJS default ignore patterns and additional rules ([d5994ad](https://github.com/minimalstuff/tooling/commit/d5994ad4ae5bef4abf33f4eaae9375f7e0689874))

## [0.3.0](https://github.com/minimalstuff/tooling/compare/v0.2.1...v0.3.0) (2026-04-10)

### Features

* integrate jsonc-parser for improved JSONC handling in update_oxc.ts ([00d10b3](https://github.com/minimalstuff/tooling/commit/00d10b387d57e6933b7b5f9c4ecb18cf9987ca2d))

## [0.2.1](https://github.com/minimalstuff/tooling/compare/v0.2.0...v0.2.1) (2026-04-09)

## [0.2.0](https://github.com/minimalstuff/tooling/compare/v0.1.3...v0.2.0) (2026-04-08)

### Features

* add new peer dependency for oxlint-tsgolint and add some rules ([e5983eb](https://github.com/minimalstuff/tooling/commit/e5983eba01e40a30eee76899261501b148882915))
* remove tsconfig setup ([b36d8fb](https://github.com/minimalstuff/tooling/commit/b36d8fb734a6ead2bbd94078d4fcdf863daf97e0))

## [0.1.3](https://github.com/minimalstuff/tooling/compare/v0.1.2...v0.1.3) (2026-04-02)

## [0.1.2](https://github.com/minimalstuff/tooling/compare/v0.1.1...v0.1.2) (2026-04-02)

## [0.1.1](https://github.com/minimalstuff/tooling/compare/v0.1.0...v0.1.1) (2026-04-02)

## 0.1.0 (2026-04-02)

### Features

- replace vue with react ([4938367](https://github.com/minimalstuff/tooling/commit/49383672cd1a0dcdd58682b7608f6c49cd293be6))

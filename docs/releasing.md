# Release a version

[README](../README.md)

Every user-visible change needs a line under `## [Unreleased]` in `CHANGELOG.md` (Keep a Changelog, written by hand) before you release.

## Release a stable version

On `main`, with a clean working tree pushed to its upstream (release-it requires both), run:

```bash
GITHUB_TOKEN=$(gh auth token) pnpm release
```

release-it, configured in the `release-it` field of `package.json`:

1. Runs `pnpm checks`.
2. Bumps the version.
3. Moves the `[Unreleased]` entries to a section for the new version.
4. Commits `chore(release): <version>`.
5. Tags `v<version>`.
6. Pushes.
7. Creates the GitHub release with those notes.

`pnpm test:package` does not run locally: the publish workflow runs it.

## Release a prerelease

```bash
GITHUB_TOKEN=$(gh auth token) pnpm release:next
```

The entries stay under `[Unreleased]`, so the next stable release lists them. The package is published under the `next` dist-tag.

Do not run `pnpm release --preRelease=next`: it moves the entries to a prerelease section, and the next stable release fails with `There are no entries under "Unreleased" section in CHANGELOG.md.`

In the `release:next` script, the `keepUnreleased` flag must stay bare: `=false` would be read as true.

## What the publish workflow does

`.github/workflows/publish.yml` runs when a GitHub release is published:

1. Runs the checks and `pnpm test:package` (`checks.yml`).
2. Builds and runs `pnpm pack`, without cache.
3. Checks that the release tag matches the package version.
4. Runs `npm publish` with provenance, under the `next` dist-tag for a prerelease version and `latest` otherwise.
5. Checks that the provenance attestation exists.

## Trusted publishing setup

Publishing uses npm [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC), no token needed. On npmjs.com, `@minimalstuff/tooling` > **Settings > Trusted publishing** must list GitHub Actions with organization `minimalstuff`, repository `tooling` and workflow `publish.yml`. Publishing a GitHub release triggers the workflow.

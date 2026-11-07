# Release a version

[README](../README.md)

Every user-visible change needs a line under `## [Unreleased]` in `CHANGELOG.md` (Keep a Changelog, written by hand) before you release.

A release only happens in CI, through the `publish.yml` workflow. Do not run `pnpm release` locally.

## Release a stable version

```bash
gh workflow run publish.yml -f increment=minor
```

Or use **Actions > CI & Publish > Run workflow** on `main`. `increment` is `patch`, `minor` or `major`.

## Release a prerelease

```bash
gh workflow run publish.yml -f increment=minor -f prerelease=true
```

The workflow runs `pnpm release:next`: the entries stay under `[Unreleased]`, so the next stable release lists them. The package is published under the `next` dist-tag.

Do not run `release-it --preRelease=next` through `pnpm release`: it moves the entries to a prerelease section, and the next stable release fails with `There are no entries under "Unreleased" section in CHANGELOG.md.`

In the `release:next` script, the `keepUnreleased` flag must stay bare: `=false` would be read as true.

## What the publish workflow does

`.github/workflows/publish.yml` runs on manual dispatch:

1. `checks`: runs the checks and `pnpm test:package` (`checks.yml`).
2. `release`: calls the reusable `release.yml`, which fails unless it runs on `main`, installs dependencies, runs `tooling check-release` (from the sources, since the package's own bin is not installed here), then runs release-it with `--ci`. release-it bumps the version, moves the `[Unreleased]` entries to a section for the new version, commits `chore(release): <version>`, tags `v<version>`, pushes with the deploy key and creates the GitHub release.
3. `build`: checks out the tag and runs `pnpm pack`, without cache.
4. `publish`: checks that the tag matches the packed version, runs `npm publish` with provenance (`next` dist-tag for a prerelease version, `latest` otherwise), then checks that the provenance attestation exists.

Only one release runs at a time and a running release is never cancelled.

## One-time setup

Done by hand, once per repository.

### Environments and deploy key

The deploy key is stored as an environment secret, so only a run on `main` whose release job declares the environment can read it. The reusable workflow declares the environment on its job, and the caller passes the secret by name (`release-deploy-key: ${{ secrets.RELEASE_DEPLOY_KEY }}`); the calling job declares none. Pushing with it instead of `GITHUB_TOKEN` lets a tag ruleset allow only CI to create tags, and makes the pushed commit and tag trigger other workflows.

1. In **Settings > Environments**, create the environment `release`. Under **Deployment branches and tags**, select **Selected branches and tags** and add `main` only.
2. Generate a key: `ssh-keygen -t ed25519 -N "" -C "release" -f release_deploy_key`.
3. In **Settings > Deploy keys**, add `release_deploy_key.pub` with **Allow write access**.
4. In the `release` environment, add the environment secret `RELEASE_DEPLOY_KEY` with the content of `release_deploy_key`. Then delete both local files.
5. Create the environment `npm`, also restricted to `main` only. The `publish` job runs in it.
6. In **Settings > Rules > Rulesets**, create a tag ruleset targeting all tags, with **Restrict creations**, **Restrict updates** and **Restrict deletions**. Its only bypass actor is **Deploy keys**. Add no admin or role bypass: otherwise a local `git push --tags` still works.

> [!NOTE]
> Whether a deploy key bypasses the ruleset is to be verified on the first release.

The `main` branch protection, if any, must also let the deploy key push the release commit.

The key is loaded in `ssh-agent` only in the last step that pushes, after dependencies are installed with `--ignore-scripts` and release-it has committed and tagged locally. It is never written to disk.

## Trusted publishing setup

Publishing uses npm [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC), no token needed. On npmjs.com, `@minimalstuff/tooling` > **Settings > Trusted publishing** must list GitHub Actions with organization `minimalstuff`, repository `tooling`, workflow `publish.yml` and environment `npm`. The `npm publish` step must stay in `publish.yml`: the trust is bound to that file name, not to `release.yml`.

Under **Publishing access**, select **Require two-factor authentication and disallow tokens**, so no token can publish.

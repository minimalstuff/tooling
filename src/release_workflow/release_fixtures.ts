export const REPOSITORY = 'minimalstuff/tooling';
export const BASE_VERSION = '0.11.0';
export const NEW_VERSION = '0.12.0';
const RELEASE_DATE = '2026-11-22';

const PREVIOUS_VERSION = '0.10.0';
const REPOSITORY_URL = `https://github.com/${REPOSITORY}`;

export function buildPackageJson(version: string): string {
	return `{
	"name": "@minimalstuff/tooling",
	"version": "${version}",
	"scripts": {
		"release": "release-it"
	},
	"dependencies": {
		"yaml": "^2.9.1"
	}
}
`;
}

export function buildChangelog(): string {
	return `# Changelog

## [Unreleased]

### Added

- A feature.

## [${BASE_VERSION}] - 2026-11-08

### Added

- An older feature.

[Unreleased]: ${REPOSITORY_URL}/compare/v${BASE_VERSION}...HEAD
[${BASE_VERSION}]: ${REPOSITORY_URL}/compare/v${PREVIOUS_VERSION}...v${BASE_VERSION}
`;
}

export function buildRolledChangelog(version: string): string {
	return `# Changelog

## [Unreleased]

## [${version}] - ${RELEASE_DATE}

### Added

- A feature.

## [${BASE_VERSION}] - 2026-11-08

### Added

- An older feature.

[Unreleased]: ${REPOSITORY_URL}/compare/v${version}...HEAD
[${version}]: ${REPOSITORY_URL}/compare/v${BASE_VERSION}...v${version}
[${BASE_VERSION}]: ${REPOSITORY_URL}/compare/v${PREVIOUS_VERSION}...v${BASE_VERSION}
`;
}

export function buildFrenchChangelog(version?: string): string {
	const rolled = version ? `## [${version}] - ${RELEASE_DATE}\n\n` : '';
	return `# Changelog

## [Unreleased]

${rolled}### Added

- Une fonctionnalité.
`;
}

export function buildCargoToml(version: string): string {
	return `[package]
name = "devslot"
version = "${version}"
edition = "2021"

[dependencies]
clap = "4"
`;
}

export function buildCargoLock(version: string): string {
	return `version = 4

[[package]]
name = "clap"
version = "4.5.0"

[[package]]
name = "devslot"
version = "${version}"
dependencies = [
 "clap",
]
`;
}

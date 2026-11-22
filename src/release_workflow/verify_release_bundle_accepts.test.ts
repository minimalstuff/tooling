import { afterEach, describe, expect, it } from 'vitest';

import { applyStandardRelease } from '#release_workflow/apply_standard_release.ts';
import { writeFileIn } from '#release_workflow/edit_files.ts';
import {
	BASE_VERSION,
	buildCargoLock,
	buildCargoToml,
	buildChangelog,
	buildFrenchChangelog,
	buildPackageJson,
	NEW_VERSION,
} from '#release_workflow/release_fixtures.ts';
import {
	createReleaseScenario,
	type ReleaseScenario,
	type ScenarioOptions,
} from '#release_workflow/release_scenario.ts';

const PRERELEASE_BASE_VERSION = '1.0.0-next.0';
const PRERELEASE_NEW_VERSION = '1.0.0-next.1';

describe('release bundle verification (legitimate releases)', () => {
	let scenario: ReleaseScenario;

	function startScenario(
		extraFiles: Record<string, string> = {},
		options: Partial<ScenarioOptions> = {}
	): void {
		scenario = createReleaseScenario({
			baseFiles: {
				'package.json': buildPackageJson(BASE_VERSION),
				'CHANGELOG.md': buildChangelog(),
				...extraFiles,
			},
			...options,
		});
	}

	afterEach(() => {
		scenario.cleanup();
	});

	it('should accept a stable release that bumps package.json and rolls the changelog', () => {
		startScenario();
		const candidateSha = scenario.addCandidate({
			commits: [applyStandardRelease],
		});

		const { exitCode, outputs } = scenario.verify();

		expect(exitCode).toBe(0);
		expect(outputs).toEqual({
			version: NEW_VERSION,
			tag: `v${NEW_VERSION}`,
			sha: candidateSha,
		});
	});

	it('should accept a release when the workflow checkout is shallow', () => {
		startScenario({}, { isPublishCheckoutShallow: true });
		scenario.addCandidate({ commits: [applyStandardRelease] });

		expect(scenario.verify().exitCode).toBe(0);
	});

	it('should accept a Cargo.toml and Cargo.lock version bump listed as version files', () => {
		startScenario({
			'Cargo.toml': buildCargoToml(BASE_VERSION),
			'Cargo.lock': buildCargoLock(BASE_VERSION),
		});
		scenario.addCandidate({
			commits: [
				(directory) => {
					applyStandardRelease(directory);
					writeFileIn(directory, 'Cargo.toml', buildCargoToml(NEW_VERSION));
					writeFileIn(directory, 'Cargo.lock', buildCargoLock(NEW_VERSION));
				},
			],
		});

		const { exitCode } = scenario.verify({
			versionFiles: 'package.json Cargo.toml Cargo.lock',
		});

		expect(exitCode).toBe(0);
	});

	it('should accept a prerelease that leaves the changelog unchanged', () => {
		startScenario({
			'package.json': buildPackageJson(PRERELEASE_BASE_VERSION),
		});
		scenario.addCandidate({
			commits: [
				(directory) =>
					writeFileIn(
						directory,
						'package.json',
						buildPackageJson(PRERELEASE_NEW_VERSION)
					),
			],
		});

		const { exitCode, outputs } = scenario.verify();

		expect(exitCode).toBe(0);
		expect(outputs['tag']).toBe(`v${PRERELEASE_NEW_VERSION}`);
	});

	it('should accept a second changelog file listed in changelog-files', () => {
		startScenario({ 'CHANGELOG.fr.md': buildFrenchChangelog() });
		scenario.addCandidate({
			commits: [
				(directory) => {
					applyStandardRelease(directory);
					writeFileIn(
						directory,
						'CHANGELOG.fr.md',
						buildFrenchChangelog(NEW_VERSION)
					);
				},
			],
		});

		const { exitCode } = scenario.verify({
			changelogFiles: 'CHANGELOG.md CHANGELOG.fr.md',
		});

		expect(exitCode).toBe(0);
	});

	it('should accept an empty tag prefix and name the tag after the version only', () => {
		startScenario();
		scenario.addCandidate({ commits: [applyStandardRelease] });

		const { exitCode, outputs } = scenario.verify({ tagPrefix: '' });

		expect(exitCode).toBe(0);
		expect(outputs['tag']).toBe(NEW_VERSION);
	});
});

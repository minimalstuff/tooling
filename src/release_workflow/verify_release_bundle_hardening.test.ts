import { afterEach, describe, expect, it } from 'vitest';

import { applyStandardRelease } from '#release_workflow/apply_standard_release.ts';
import { replaceInFile, writeFileIn } from '#release_workflow/edit_files.ts';
import {
	BASE_VERSION,
	buildChangelog,
	buildPackageJson,
} from '#release_workflow/release_fixtures.ts';
import {
	createReleaseScenario,
	type ReleaseScenario,
} from '#release_workflow/release_scenario.ts';
import { runGit } from '#release_workflow/run_git.ts';

const BOT_IDENTITY =
	'github-actions[bot] <41898298+github-actions[bot]@users.noreply.github.com>';

describe('release bundle verification (hardening)', () => {
	let scenario: ReleaseScenario;

	function startScenario(version: string = BASE_VERSION): void {
		scenario = createReleaseScenario({
			baseFiles: {
				'package.json': buildPackageJson(version),
				'CHANGELOG.md': buildChangelog(),
			},
		});
	}

	function bumpTo(version: string): void {
		scenario.addCandidate({
			commits: [
				(directory) =>
					writeFileIn(directory, 'package.json', buildPackageJson(version)),
			],
		});
	}

	afterEach(() => {
		scenario.cleanup();
	});

	describe('release commit rebuild', () => {
		it('should push a rebuilt commit with the template message and the bot identity', () => {
			startScenario();
			const candidateSha = scenario.addCandidate({
				commits: [applyStandardRelease],
				hostileCommit: {},
			});

			const { exitCode, outputs } = scenario.verify({
				commitMessage: 'chore: release v${version}',
			});
			const commit = runGit(scenario.publishDirectory, [
				'cat-file',
				'commit',
				outputs['sha'] ?? '',
			]);

			expect(exitCode).toBe(0);
			expect(outputs['sha']).not.toBe(candidateSha);
			expect(commit).toContain(`author ${BOT_IDENTITY} 1700000000 +0000`);
			expect(commit).toContain(`committer ${BOT_IDENTITY} 1700000000 +0000`);
			expect(commit).toContain(`parent ${scenario.baseSha}`);
			expect(commit).not.toContain('x-evil');
			expect(commit).not.toContain('evil');
			expect(commit.endsWith('\n\nchore: release v0.12.0')).toBe(true);
		});

		it('should rebuild the same commit when the verification runs twice', () => {
			startScenario();
			scenario.addCandidate({ commits: [applyStandardRelease] });

			const first = scenario.verify();
			const second = scenario.verify();

			expect(first.outputs['sha']).toBe(second.outputs['sha']);
		});

		it('should refuse a candidate with a malformed date', () => {
			startScenario();
			scenario.addCandidate({
				commits: [applyStandardRelease],
				hostileCommit: { date: '1700000000 +00:00' },
			});

			expect(scenario.verify()).toMatchObject({
				exitCode: 1,
				output: expect.stringContaining('fails the object checks'),
			});
		});

		it('should refuse a commit message template that renders to several lines', () => {
			startScenario();
			scenario.addCandidate({ commits: [applyStandardRelease] });

			expect(
				scenario.verify({ commitMessage: 'chore: ${version}\n\nCloses #1' })
			).toMatchObject({
				exitCode: 1,
				output: expect.stringContaining('single printable line'),
			});
		});
	});

	describe('increment', () => {
		it.each([
			['0.11.0', 'patch', '0.11.1'],
			['0.11.0', 'minor', '0.12.0'],
			['0.11.0', 'major', '1.0.0'],
			['0.11.0', 'minor', '0.12.0-next.0'],
			['1.0.0-next.0', 'prerelease', '1.0.0-next.1'],
			['1.0.0-next.3', 'major', '1.0.0'],
			['0.0.0', 'minor', '0.1.0'],
		])(
			'should accept %s with increment %s giving %s',
			(oldVersion, increment, newVersion) => {
				startScenario(oldVersion);
				bumpTo(newVersion);

				expect(scenario.verify({ increment }).exitCode).toBe(0);
			}
		);

		it.each([
			['0.11.0', 'minor', '0.9.0'],
			['0.11.0', 'minor', '0.13.0'],
			['0.11.0', 'patch', '0.12.0'],
			['0.11.0', 'minor', '0.12.0-official-fix.at.evil-example.com'],
			['1.0.0-next.0', 'prerelease', '1.0.0'],
			['1.0.0-next.0', 'prerelease', '1.1.0-next.0'],
		])(
			'should refuse %s with increment %s giving %s',
			(oldVersion, increment, newVersion) => {
				startScenario(oldVersion);
				bumpTo(newVersion);

				expect(scenario.verify({ increment })).toMatchObject({
					exitCode: 1,
					output: expect.stringMatching(
						/is not what increment|pre-release part|must produce a prerelease/
					),
				});
			}
		);
	});

	describe('changelog links', () => {
		it('should refuse a link that climbs out of the repository with dot segments', () => {
			startScenario();
			scenario.addCandidate({
				commits: [
					(directory) => {
						applyStandardRelease(directory);
						replaceInFile(
							directory,
							'CHANGELOG.md',
							'compare/v0.11.0...v0.12.0',
							'compare/../../../attacker/phish'
						);
					},
				],
			});

			expect(scenario.verify()).toMatchObject({
				exitCode: 1,
				output: expect.stringContaining(
					'added line: [0.12.0]: https://github.com/minimalstuff/tooling/compare/../../../attacker/phish'
				),
			});
		});
	});
});

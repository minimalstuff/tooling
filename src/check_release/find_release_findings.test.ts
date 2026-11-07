import { describe, expect, it } from 'vitest';
import { parseAllDocuments } from 'yaml';

import { findReleaseFindings } from '#check_release/find_release_findings.ts';
import { buildLockfile } from '#check_release/lockfile_fixtures.ts';
import { RELEASE_FINDING_KIND } from '#check_release/release_finding.ts';

const REPOSITORY_ROOT = '/work/app';

function findInLockfile(raw: string): ReturnType<typeof findReleaseFindings> {
	const documents = parseAllDocuments(raw).map((document): unknown =>
		document.toJS()
	);
	return findReleaseFindings(documents, REPOSITORY_ROOT);
}

describe('findReleaseFindings', () => {
	it('should report a patch when a minimalstuff package is patched with an exact version key', () => {
		const findings = findInLockfile(
			buildLockfile({
				patchedDependencies: { '@minimalstuff/ui@5.2.0': 'abc' },
			})
		);

		expect(findings).toEqual([
			expect.objectContaining({
				kind: RELEASE_FINDING_KIND.patch,
				packageName: '@minimalstuff/ui',
				location: 'patchedDependencies',
			}),
		]);
	});

	it('should report a patch when the key has no version', () => {
		const findings = findInLockfile(
			buildLockfile({ patchedDependencies: { '@minimalstuff/ui': 'abc' } })
		);

		expect(findings.map((finding) => finding.packageName)).toEqual([
			'@minimalstuff/ui',
		]);
	});

	it('should ignore patches on packages outside the minimalstuff scope', () => {
		const findings = findInLockfile(
			buildLockfile({ patchedDependencies: { 'left-pad@1.3.0': 'abc' } })
		);

		expect(findings).toEqual([]);
	});

	it('should report a local dependency when the version is a file specifier', () => {
		const findings = findInLockfile(
			buildLockfile({
				importers: {
					'.': {
						devDependencies: { '@minimalstuff/ui': 'file:../ui' },
					},
				},
			})
		);

		expect(findings).toEqual([
			expect.objectContaining({
				kind: RELEASE_FINDING_KIND.localDependency,
				packageName: '@minimalstuff/ui',
				location: 'importer "." (devDependencies)',
			}),
		]);
	});

	it('should report a local dependency when a link points outside the repository', () => {
		const findings = findInLockfile(
			buildLockfile({
				importers: {
					'.': {
						dependencies: { '@minimalstuff/ui': 'link:../ui-minimalstuff' },
					},
				},
			})
		);

		expect(findings).toHaveLength(1);
	});

	it('should resolve a link relative to the importer directory', () => {
		const findings = findInLockfile(
			buildLockfile({
				importers: {
					'apps/web': {
						dependencies: { '@minimalstuff/ui': 'link:../../packages/ui' },
					},
				},
			})
		);

		expect(findings).toEqual([]);
	});

	it('should report a link from a workspace importer that escapes the repository', () => {
		const findings = findInLockfile(
			buildLockfile({
				importers: {
					'apps/web': {
						optionalDependencies: {
							'@minimalstuff/ui': 'link:../../../ui-minimalstuff',
						},
					},
				},
			})
		);

		expect(findings).toEqual([
			expect.objectContaining({
				location: 'importer "apps/web" (optionalDependencies)',
			}),
		]);
	});

	it('should ignore a link that stays inside the repository', () => {
		const findings = findInLockfile(
			buildLockfile({
				importers: {
					'.': {
						dependencies: { '@minimalstuff/ui': 'link:packages/ui' },
					},
				},
			})
		);

		expect(findings).toEqual([]);
	});

	it('should ignore a local dependency outside the minimalstuff scope', () => {
		const findings = findInLockfile(
			buildLockfile({
				importers: {
					'.': { dependencies: { 'left-pad': 'link:../left-pad' } },
				},
			})
		);

		expect(findings).toEqual([]);
	});

	it('should ignore a published version of a minimalstuff package', () => {
		const findings = findInLockfile(
			buildLockfile({
				importers: { '.': { dependencies: { '@minimalstuff/ui': '5.2.0' } } },
			})
		);

		expect(findings).toEqual([]);
	});

	it('should report a local dependency when the version is a git url', () => {
		const findings = findInLockfile(
			buildLockfile({
				importers: {
					'.': {
						dependencies: {
							'@minimalstuff/ui':
								'git+https://github.com/minimalstuff/ui.git#abc123',
						},
					},
				},
			})
		);

		expect(findings).toHaveLength(1);
	});

	it('should report a local dependency when the version is a tarball url', () => {
		const findings = findInLockfile(
			buildLockfile({
				importers: {
					'.': {
						dependencies: {
							'@minimalstuff/ui':
								'https://codeload.github.com/minimalstuff/ui/tar.gz/abc123',
						},
					},
				},
			})
		);

		expect(findings).toHaveLength(1);
	});

	it('should ignore a registry version followed by a peer suffix', () => {
		const findings = findInLockfile(
			buildLockfile({
				importers: {
					'.': {
						dependencies: { '@minimalstuff/ui': '5.2.0(react@19.2.0)' },
					},
				},
			})
		);

		expect(findings).toEqual([]);
	});

	it('should ignore a registry version followed by a patch hash', () => {
		const findings = findInLockfile(
			buildLockfile({
				importers: {
					'.': {
						dependencies: { '@minimalstuff/ui': '5.2.0(patch_hash=abc)' },
					},
				},
			})
		);

		expect(findings).toEqual([]);
	});

	it('should ignore an override that pins a version range', () => {
		const findings = findInLockfile(
			buildLockfile({ overrides: { '@minimalstuff/ui': '^5.0.0' } })
		);

		expect(findings).toEqual([]);
	});

	it('should ignore an override that uses the npm protocol', () => {
		const findings = findInLockfile(
			buildLockfile({
				overrides: { '@minimalstuff/ui': 'npm:@minimalstuff/ui@5' },
			})
		);

		expect(findings).toEqual([]);
	});

	it('should report an override that points to a file', () => {
		const findings = findInLockfile(
			buildLockfile({ overrides: { '@minimalstuff/ui': 'file:../ui' } })
		);

		expect(findings).toHaveLength(1);
	});

	it('should report an override that links outside the repository', () => {
		const findings = findInLockfile(
			buildLockfile({ overrides: { '@minimalstuff/ui': 'link:../x' } })
		);

		expect(findings).toHaveLength(1);
	});

	it('should report an override that points to a git url', () => {
		const findings = findInLockfile(
			buildLockfile({
				overrides: { '@minimalstuff/ui': 'github:minimalstuff/ui#abc123' },
			})
		);

		expect(findings).toHaveLength(1);
	});

	it('should report an override when a minimalstuff package is linked outside the repository', () => {
		const findings = findInLockfile(
			buildLockfile({ overrides: { '@minimalstuff/ui': 'link:../ui' } })
		);

		expect(findings).toEqual([
			expect.objectContaining({
				kind: RELEASE_FINDING_KIND.override,
				packageName: '@minimalstuff/ui',
				location: 'overrides',
			}),
		]);
	});

	it('should ignore an override that pins a published version', () => {
		const findings = findInLockfile(
			buildLockfile({ overrides: { '@minimalstuff/ui': '5.2.0' } })
		);

		expect(findings).toEqual([]);
	});

	it('should ignore an override that links inside the repository', () => {
		const findings = findInLockfile(
			buildLockfile({ overrides: { '@minimalstuff/ui': 'link:packages/ui' } })
		);

		expect(findings).toEqual([]);
	});

	it('should return no finding when the lockfile has the env document first and nothing to report', () => {
		expect(findInLockfile(buildLockfile())).toEqual([]);
	});

	it('should scan every document of the lockfile', () => {
		const raw = `---
lockfileVersion: '9.0'
patchedDependencies:
  '@minimalstuff/tooling@0.8.2': abc
---
lockfileVersion: '9.0'
patchedDependencies:
  '@minimalstuff/ui@5.2.0': def
`;

		expect(findInLockfile(raw).map((finding) => finding.packageName)).toEqual([
			'@minimalstuff/tooling',
			'@minimalstuff/ui',
		]);
	});
});

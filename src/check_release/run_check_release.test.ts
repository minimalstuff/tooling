import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	EXIT_CODE_CLEAN,
	EXIT_CODE_FINDINGS,
	EXIT_CODE_INVALID_INPUT,
	LOCKFILE_NAME,
} from '#check_release/constants.ts';
import { buildLockfile } from '#check_release/lockfile_fixtures.ts';
import { runCheckRelease } from '#check_release/run_check_release.ts';

describe('runCheckRelease', () => {
	let directory: string;

	beforeEach(async () => {
		directory = await mkdtemp(join(tmpdir(), 'check-release-'));
		vi.spyOn(console, 'log').mockImplementation(() => undefined);
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		await rm(directory, { recursive: true, force: true });
	});

	it('should return the invalid input code when the lockfile is missing', async () => {
		expect(await runCheckRelease(directory)).toBe(EXIT_CODE_INVALID_INPUT);
		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining('only supports pnpm projects')
		);
	});

	it('should return the invalid input code when the lockfile is not valid YAML', async () => {
		await writeFile(join(directory, LOCKFILE_NAME), 'a: [unclosed');

		expect(await runCheckRelease(directory)).toBe(EXIT_CODE_INVALID_INPUT);
	});

	it('should return the clean code when nothing is patched or linked', async () => {
		await writeFile(join(directory, LOCKFILE_NAME), buildLockfile());

		expect(await runCheckRelease(directory)).toBe(EXIT_CODE_CLEAN);
	});

	it('should return the findings code and print each finding when a package is patched', async () => {
		await writeFile(
			join(directory, LOCKFILE_NAME),
			buildLockfile({
				patchedDependencies: { '@minimalstuff/ui@5.2.0': 'abc' },
			})
		);

		expect(await runCheckRelease(directory)).toBe(EXIT_CODE_FINDINGS);
		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining('patch: @minimalstuff/ui')
		);
	});
});

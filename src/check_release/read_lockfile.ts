import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { LOCKFILE_NAME } from '#check_release/constants.ts';
import { parseLockfile } from '#check_release/parse_lockfile.ts';
import {
	E_LOCKFILE_MISSING,
	E_LOCKFILE_UNREADABLE,
	ReleaseCheckError,
} from '#check_release/release_check_error.ts';

function isMissingFileError(error: unknown): boolean {
	return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

async function readLockfileText(directory: string): Promise<string> {
	try {
		return await readFile(join(directory, LOCKFILE_NAME), 'utf8');
	} catch (error: unknown) {
		if (isMissingFileError(error)) {
			throw new ReleaseCheckError(
				E_LOCKFILE_MISSING,
				`No ${LOCKFILE_NAME} found in ${directory}: check-release only supports pnpm projects`
			);
		}
		const reason = error instanceof Error ? error.message : String(error);
		throw new ReleaseCheckError(
			E_LOCKFILE_UNREADABLE,
			`Cannot read ${LOCKFILE_NAME}: ${reason}`
		);
	}
}

export async function readLockfile(directory: string): Promise<unknown[]> {
	return parseLockfile(await readLockfileText(directory), LOCKFILE_NAME);
}

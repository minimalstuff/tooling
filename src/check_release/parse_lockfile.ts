import { parseAllDocuments } from 'yaml';

import { isRecord } from '#check_release/is_record.ts';
import {
	E_LOCKFILE_INVALID,
	ReleaseCheckError,
} from '#check_release/release_check_error.ts';

/**
 * Parses every YAML document of a pnpm lockfile: pnpm 12 writes an env
 * document before the main one.
 */
export function parseLockfile(raw: string, fileName: string): unknown[] {
	const documents = parseAllDocuments(raw);
	const firstError = documents.flatMap((document) => document.errors)[0];
	if (firstError) {
		throw new ReleaseCheckError(
			E_LOCKFILE_INVALID,
			`${fileName} is not valid YAML: ${firstError.message}`
		);
	}

	const parsed = documents.map((document): unknown => document.toJS());
	const hasLockfileVersion = parsed.some(
		(document) => isRecord(document) && 'lockfileVersion' in document
	);
	if (!hasLockfileVersion) {
		throw new ReleaseCheckError(
			E_LOCKFILE_INVALID,
			`${fileName} has no lockfileVersion: it is not a pnpm lockfile`
		);
	}
	return parsed;
}

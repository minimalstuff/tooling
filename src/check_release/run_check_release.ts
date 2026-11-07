import color from 'picocolors';

import {
	EXIT_CODE_CLEAN,
	EXIT_CODE_FINDINGS,
	EXIT_CODE_INVALID_INPUT,
} from '#check_release/constants.ts';
import { findReleaseFindings } from '#check_release/find_release_findings.ts';
import {
	formatReleaseFinding,
	formatSummary,
} from '#check_release/format_release_findings.ts';
import { readLockfile } from '#check_release/read_lockfile.ts';
import { ReleaseCheckError } from '#check_release/release_check_error.ts';

export async function runCheckRelease(directory: string): Promise<number> {
	try {
		const documents = await readLockfile(directory);
		const findings = findReleaseFindings(documents, directory);

		if (findings.length === 0) {
			console.log(
				color.green(
					'check-release: no patched or linked @minimalstuff/* package.'
				)
			);
			return EXIT_CODE_CLEAN;
		}

		for (const finding of findings) {
			console.error(color.red(formatReleaseFinding(finding)));
		}
		console.error(formatSummary(findings.length));
		return EXIT_CODE_FINDINGS;
	} catch (error: unknown) {
		if (!(error instanceof ReleaseCheckError)) throw error;
		console.error(color.red(`check-release: ${error.message}`));
		return EXIT_CODE_INVALID_INPUT;
	}
}

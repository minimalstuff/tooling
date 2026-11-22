import { writeFileIn } from '#release_workflow/edit_files.ts';
import {
	buildPackageJson,
	buildRolledChangelog,
	NEW_VERSION,
} from '#release_workflow/release_fixtures.ts';

/**
 * Writes what release-it does for a stable release: the new version in
 * package.json and the rolled CHANGELOG.md.
 */
export function applyStandardRelease(directory: string): void {
	writeFileIn(directory, 'package.json', buildPackageJson(NEW_VERSION));
	writeFileIn(directory, 'CHANGELOG.md', buildRolledChangelog(NEW_VERSION));
}

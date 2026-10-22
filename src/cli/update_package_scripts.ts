import { log } from '@clack/prompts';

import { buildScripts } from './package_scripts.ts';
import type { PromptResult } from './types.ts';
import { addMissingScripts } from './update_package_json_scripts.ts';

export async function updatePackageScripts(
	result: PromptResult
): Promise<void> {
	const scripts = buildScripts(result.tools);
	if (Object.keys(scripts).length === 0) return;

	const merge = await addMissingScripts(process.cwd(), scripts);

	if (merge.addedNames.length > 0) {
		log.success(`package.json scripts added: ${merge.addedNames.join(', ')}`);
	}
	if (merge.skippedNames.length > 0) {
		log.info(
			`package.json scripts already defined, kept: ${merge.skippedNames.join(', ')}`
		);
	}
}

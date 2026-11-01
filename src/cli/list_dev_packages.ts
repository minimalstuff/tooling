import { listOxcPackages } from '#cli/list_oxc_packages.ts';
import type { PromptResult } from '#cli/types.ts';
import { TOOLING_PACKAGE_NAME } from '#constants.ts';

const KNIP_PACKAGES: readonly string[] = ['knip', TOOLING_PACKAGE_NAME];

export function listDevPackages(result: PromptResult): string[] {
	const oxcPackages = result.tools.includes('oxc')
		? listOxcPackages(result.presetFlags)
		: [];
	const knipPackages = result.tools.includes('knip') ? KNIP_PACKAGES : [];

	return [...new Set([...oxcPackages, ...knipPackages])];
}

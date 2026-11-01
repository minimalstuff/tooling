import { TOOLING_PACKAGE_NAME } from '../constants.ts';
import { listOxcPackages } from './list_oxc_packages.ts';
import type { PromptResult } from './types.ts';

const KNIP_PACKAGES: readonly string[] = ['knip', TOOLING_PACKAGE_NAME];

export function listDevPackages(result: PromptResult): string[] {
	const oxcPackages = result.tools.includes('oxc')
		? listOxcPackages(result.presetFlags)
		: [];
	const knipPackages = result.tools.includes('knip') ? KNIP_PACKAGES : [];

	return [...new Set([...oxcPackages, ...knipPackages])];
}

import type { PresetFlags } from '#cli/types.ts';
import { TOOLING_PACKAGE_NAME } from '#constants.ts';

const BASE_OXC_PACKAGES: readonly string[] = [
	'oxfmt',
	'oxlint',
	'oxlint-tsgolint',
	TOOLING_PACKAGE_NAME,
];
const ADONISJS_ESLINT_PLUGIN_PACKAGE = '@adonisjs/eslint-plugin';

export function listOxcPackages(presetFlags: PresetFlags): string[] {
	if (!presetFlags.adonisjs) return [...BASE_OXC_PACKAGES];
	return [...BASE_OXC_PACKAGES, ADONISJS_ESLINT_PLUGIN_PACKAGE];
}

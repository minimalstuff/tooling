export const TOOLING_PACKAGE_NAME = '@minimalstuff/tooling';

export const OXC_LINT_IMPORT: string = `${TOOLING_PACKAGE_NAME}/oxc/lint`;
export const OXC_FMT_IMPORT: string = `${TOOLING_PACKAGE_NAME}/oxc/fmt`;

export const KNIP_IMPORT: string = `${TOOLING_PACKAGE_NAME}/knip`;

export const KNIP_CONFIG_FILE_NAME = 'knip.ts';
export const KNIP_CONFIG_FILE_NAMES: readonly string[] = [
	KNIP_CONFIG_FILE_NAME,
	'knip.json',
	'knip.jsonc',
	'.knip.json',
	'.knip.jsonc',
	'knip.config.ts',
];

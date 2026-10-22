import { afterEach, describe, expect, it } from 'vitest';

import {
	FORMAT_PRESET_PATH,
	createFixture,
	runBinary,
	type Fixture,
} from '../oxc/test_utils.ts';
import { buildKnipConfigContent } from './knip_config_content.ts';
import {
	buildOxfmtConfigContent,
	buildOxlintConfigContent,
} from './oxc_config_content.ts';
import type { PresetFlags } from './types.ts';

const GENERATED_FILE_NAME = 'generated.config.ts';
const FORMATTER_CONFIG_NAME = 'oxfmt.config.ts';
const NO_PRESETS: PresetFlags = {
	react: false,
	adonisjs: false,
	vitest: false,
};
const ALL_PRESETS: PresetFlags = { react: true, adonisjs: true, vitest: true };
const LONG_WORKSPACE_PATHS = [
	'apps/customer-facing-webapp',
	'packages/internal-backend-api',
	'packages/background-workers',
];

const GENERATED_CONTENTS: ReadonlyArray<readonly [string, string]> = [
	['oxlint without presets', buildOxlintConfigContent(NO_PRESETS)],
	[
		'oxlint with one preset',
		buildOxlintConfigContent({ ...NO_PRESETS, react: true }),
	],
	['oxlint with all presets', buildOxlintConfigContent(ALL_PRESETS)],
	['oxfmt without adonisjs', buildOxfmtConfigContent(NO_PRESETS)],
	[
		'oxfmt with adonisjs',
		buildOxfmtConfigContent({ ...NO_PRESETS, adonisjs: true }),
	],
	[
		'knip with two short workspace paths',
		buildKnipConfigContent(['apps/webapp', 'packages/api']),
	],
	['knip without options', buildKnipConfigContent(undefined)],
	['knip with adonisjs on the root', buildKnipConfigContent(true)],
	[
		'knip with workspace paths exceeding the print width',
		buildKnipConfigContent(LONG_WORKSPACE_PATHS),
	],
];

describe('generated preset config files', () => {
	let fixture: Fixture;

	afterEach(async () => {
		await fixture.remove();
	});

	it.each(GENERATED_CONTENTS)(
		'should pass oxfmt --check when generating %s',
		async (_label, content) => {
			fixture = await createFixture({
				[GENERATED_FILE_NAME]: content,
				[FORMATTER_CONFIG_NAME]: `import { minimalstuffPreset } from '${FORMAT_PRESET_PATH}';\n\nexport default minimalstuffPreset();\n`,
			});

			const outcome = await runBinary('oxfmt', fixture.directory, [
				'--check',
				'-c',
				FORMATTER_CONFIG_NAME,
				GENERATED_FILE_NAME,
			]);

			expect(outcome.output).not.toContain(GENERATED_FILE_NAME);
			expect(outcome.exitCode).toBe(0);
		}
	);
});

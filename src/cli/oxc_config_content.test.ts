import { describe, expect, it } from 'vitest';

import {
	buildOxfmtConfigContent,
	buildOxlintConfigContent,
} from './oxc_config_content.ts';
import type { PresetFlags } from './types.ts';

const NO_PRESETS: PresetFlags = {
	react: false,
	adonisjs: false,
	vitest: false,
};

describe('buildOxlintConfigContent', () => {
	it('should call the preset without options when no preset is enabled', () => {
		expect(buildOxlintConfigContent(NO_PRESETS)).toBe(
			"import { minimalstuffPreset } from '@minimalstuff/tooling/oxc/lint';\n\nexport default minimalstuffPreset();\n"
		);
	});

	it('should only list enabled presets', () => {
		expect(buildOxlintConfigContent({ ...NO_PRESETS, react: true })).toContain(
			'minimalstuffPreset({ react: true });'
		);
	});

	it('should list all presets in a stable order when all are enabled', () => {
		const content = buildOxlintConfigContent({
			react: true,
			adonisjs: true,
			vitest: true,
		});
		expect(content).toBe(
			"import { minimalstuffPreset } from '@minimalstuff/tooling/oxc/lint';\n\nexport default minimalstuffPreset({ adonisjs: true, react: true, vitest: true });\n"
		);
	});

	it('should ignore the vitest flag in the formatter config', () => {
		expect(buildOxfmtConfigContent({ ...NO_PRESETS, vitest: true })).toContain(
			'minimalstuffPreset();'
		);
	});
});

describe('buildOxfmtConfigContent', () => {
	it('should call the preset without options when adonisjs is disabled', () => {
		expect(buildOxfmtConfigContent({ ...NO_PRESETS, react: true })).toBe(
			"import { minimalstuffPreset } from '@minimalstuff/tooling/oxc/fmt';\n\nexport default minimalstuffPreset();\n"
		);
	});

	it('should pass adonisjs when adonisjs is enabled', () => {
		expect(buildOxfmtConfigContent({ ...NO_PRESETS, adonisjs: true })).toBe(
			"import { minimalstuffPreset } from '@minimalstuff/tooling/oxc/fmt';\n\nexport default minimalstuffPreset({ adonisjs: true });\n"
		);
	});
});

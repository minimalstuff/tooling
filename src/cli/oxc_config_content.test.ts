import { describe, expect, it } from 'vitest';

import {
	buildOxfmtConfigContent,
	buildOxlintConfigContent,
} from '#cli/oxc_config_content.ts';
import type { PresetFlags } from '#cli/types.ts';

const NO_PRESETS: PresetFlags = {
	react: false,
	adonisjs: false,
	vitest: false,
	lingui: false,
};

describe('buildOxlintConfigContent', () => {
	it('should call the preset without options when no preset is enabled', () => {
		expect(buildOxlintConfigContent(NO_PRESETS, true)).toBe(
			"import { minimalstuffPreset } from '@minimalstuff/tooling/oxc/lint';\n\nexport default minimalstuffPreset();\n"
		);
	});

	it('should only list enabled presets', () => {
		expect(
			buildOxlintConfigContent({ ...NO_PRESETS, react: true }, true)
		).toContain('minimalstuffPreset({\n\treact: true,\n});');
	});

	it('should list all presets in a stable order when all are enabled', () => {
		const content = buildOxlintConfigContent(
			{
				react: true,
				adonisjs: true,
				vitest: true,
				lingui: true,
			},
			true
		);
		expect(content).toBe(
			"import { minimalstuffPreset } from '@minimalstuff/tooling/oxc/lint';\n\nexport default minimalstuffPreset({\n\tadonisjs: true,\n\treact: true,\n\tvitest: true,\n\tlingui: true,\n});\n"
		);
	});

	it('should disable subpathImports when the project has no subpath imports', () => {
		expect(buildOxlintConfigContent(NO_PRESETS, false)).toContain(
			'minimalstuffPreset({\n\tsubpathImports: false,\n});'
		);
	});

	it('should not mention subpathImports when the project has subpath imports', () => {
		expect(buildOxlintConfigContent(NO_PRESETS, true)).not.toContain(
			'subpathImports'
		);
	});

	it('should write lingui: true when lingui is enabled', () => {
		expect(
			buildOxlintConfigContent({ ...NO_PRESETS, lingui: true }, true)
		).toContain('minimalstuffPreset({\n\tlingui: true,\n});');
	});

	it('should ignore the lingui flag in the formatter config', () => {
		expect(buildOxfmtConfigContent({ ...NO_PRESETS, lingui: true })).toContain(
			'minimalstuffPreset();'
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
			"import { minimalstuffPreset } from '@minimalstuff/tooling/oxc/fmt';\n\nexport default minimalstuffPreset({\n\tadonisjs: true,\n});\n"
		);
	});
});

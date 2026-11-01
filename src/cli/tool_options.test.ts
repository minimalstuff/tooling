import { describe, expect, it } from 'vitest';

import {
	buildToolOptions,
	canConfigureVscode,
	type ExistingConfigs,
	selectInitialTools,
} from '#cli/tool_options.ts';

const NOTHING_EXISTS: ExistingConfigs = {
	hasEditorConfig: false,
	hasKnip: false,
	hasVscode: false,
};

describe('canConfigureVscode', () => {
	it('should return true when oxc is selected', () => {
		expect(canConfigureVscode(['editorconfig', 'oxc'])).toBe(true);
	});

	it('should return false when oxc is not selected', () => {
		expect(canConfigureVscode(['editorconfig', 'knip'])).toBe(false);
	});
});

describe('buildToolOptions', () => {
	it('should never offer vscode', () => {
		const values = buildToolOptions(NOTHING_EXISTS).map(
			(option) => option.value
		);

		expect(values).not.toContain('vscode');
	});

	it('should suffix existing configs and leave the others untouched', () => {
		const labels = buildToolOptions({
			...NOTHING_EXISTS,
			hasEditorConfig: true,
		}).map((option) => option.label);

		expect(labels).toEqual([
			'EditorConfig (already exists)',
			'OXC (oxlint + oxfmt)',
			'Knip (unused files, exports, dependencies)',
		]);
	});

	it('should suffix knip when its config exists', () => {
		const knipOption = buildToolOptions({
			...NOTHING_EXISTS,
			hasKnip: true,
		}).find((option) => option.value === 'knip');

		expect(knipOption?.label).toContain(' (already exists)');
	});
});

describe('selectInitialTools', () => {
	it('should select every tool when nothing exists', () => {
		expect(selectInitialTools(NOTHING_EXISTS)).toEqual([
			'editorconfig',
			'oxc',
			'knip',
		]);
	});

	it('should skip editorconfig and knip when they exist and keep oxc', () => {
		expect(
			selectInitialTools({
				hasEditorConfig: true,
				hasKnip: true,
				hasVscode: false,
			})
		).toEqual(['oxc']);
	});
});

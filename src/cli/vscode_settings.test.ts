import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	mergeVscodeSettings,
	updateVscodeSettings,
} from './vscode_settings.ts';

vi.mock('@clack/prompts', () => ({ log: { success: vi.fn<() => void>() } }));

describe('mergeVscodeSettings', () => {
	it('should add the missing keys', () => {
		expect(mergeVscodeSettings({ 'editor.tabSize': 2 })).toEqual({
			'editor.tabSize': 2,
			'oxc.typeAware': true,
			'editor.defaultFormatter': 'oxc.oxc-vscode',
		});
	});

	it('should keep existing values when the keys are already set', () => {
		const merged = mergeVscodeSettings({
			'oxc.typeAware': false,
			'editor.defaultFormatter': 'other.formatter',
		});

		expect(merged).toEqual({
			'oxc.typeAware': false,
			'editor.defaultFormatter': 'other.formatter',
		});
	});
});

describe('updateVscodeSettings', () => {
	let directory: string;

	beforeEach(async () => {
		directory = await mkdtemp(join(tmpdir(), 'vscode-settings-'));
	});

	afterEach(async () => {
		await rm(directory, { recursive: true, force: true });
	});

	it('should create the settings file with tabs and a trailing newline when it does not exist', async () => {
		await updateVscodeSettings(directory);

		expect(
			await readFile(join(directory, '.vscode/settings.json'), 'utf-8')
		).toBe(
			'{\n\t"oxc.typeAware": true,\n\t"editor.defaultFormatter": "oxc.oxc-vscode"\n}\n'
		);
	});

	it('should keep the existing indentation and keys when the file exists', async () => {
		await mkdir(join(directory, '.vscode'));
		await writeFile(
			join(directory, '.vscode/settings.json'),
			'{\n  // note\n  "oxc.typeAware": false\n}'
		);

		await updateVscodeSettings(directory);

		expect(
			await readFile(join(directory, '.vscode/settings.json'), 'utf-8')
		).toBe(
			'{\n  "oxc.typeAware": false,\n  "editor.defaultFormatter": "oxc.oxc-vscode"\n}\n'
		);
	});
});

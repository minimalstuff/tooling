import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildScripts } from './package_scripts.ts';
import { addMissingScripts } from './update_package_json_scripts.ts';

const OXC_SCRIPTS = buildScripts(['oxc']);

describe('addMissingScripts', () => {
	let directory: string;
	let manifestPath: string;

	beforeEach(async () => {
		directory = await mkdtemp(join(tmpdir(), 'package-scripts-'));
		manifestPath = join(directory, 'package.json');
	});

	afterEach(async () => {
		await rm(directory, { recursive: true, force: true });
	});

	it('should add only missing scripts, keep the tab indentation and end with a newline', async () => {
		await writeFile(
			manifestPath,
			'{\n\t"name": "demo",\n\t"scripts": {\n\t\t"lint": "eslint .",\n\t\t"build": "tsc"\n\t}\n}'
		);

		const merge = await addMissingScripts(directory, OXC_SCRIPTS);

		const written = await readFile(manifestPath, 'utf-8');
		expect(written.endsWith('}\n')).toBe(true);
		expect(written).toContain('\n\t"scripts": {\n\t\t"lint": "eslint .",');
		expect(JSON.parse(written).scripts).toEqual({
			...OXC_SCRIPTS,
			lint: 'eslint .',
			build: 'tsc',
		});
		expect(merge.skippedNames).toEqual(['lint']);
	});

	it('should preserve four-space indentation', async () => {
		await writeFile(manifestPath, '{\n    "name": "demo"\n}');

		await addMissingScripts(directory, { lint: 'oxlint' });

		expect(await readFile(manifestPath, 'utf-8')).toBe(
			'{\n    "name": "demo",\n    "scripts": {\n        "lint": "oxlint"\n    }\n}\n'
		);
	});

	it('should leave the file untouched when every script already exists', async () => {
		const original = '{"scripts":{"lint":"x"}}';
		await writeFile(manifestPath, original);

		await addMissingScripts(directory, { lint: 'oxlint' });

		expect(await readFile(manifestPath, 'utf-8')).toBe(original);
	});
});

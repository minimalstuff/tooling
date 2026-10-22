import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { minimalstuffPreset } from './fmt.ts';
import {
	ADONISJS_IGNORE_PATTERNS,
	COMMON_IGNORE_PATTERNS,
	FORMAT_ONLY_IGNORE_PATTERNS,
} from './shared.ts';
import {
	FORMAT_PRESET_PATH,
	createFixture,
	runBinary,
	type Fixture,
} from './test_utils.ts';

const UNSORTED_IMPORTS_SOURCE = `import { b } from './b.ts';
import { z } from 'zod';
import { a } from 'a';
import { readFile } from 'node:fs/promises';
`;
const SORTED_IMPORTS_SOURCE = `import { a } from 'a';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';

import { b } from './b.ts';
`;
const UNFORMATTED_CHANGELOG = '#   Changelog\n\n\n\n*   entry\n';

describe('minimalstuffPreset (oxfmt) config', () => {
	it('should use the preset formatting defaults when no option is given', () => {
		const config = minimalstuffPreset();

		expect(config).toMatchObject({
			printWidth: 80,
			tabWidth: 2,
			useTabs: true,
			semi: true,
			singleQuote: true,
			trailingComma: 'es5',
		});
	});

	it('should let user options override the defaults when provided', () => {
		const config = minimalstuffPreset({ printWidth: 120, semi: false });

		expect(config).toMatchObject({ printWidth: 120, semi: false });
	});

	it('should include common and format-only ignore patterns when no option is given', () => {
		const config = minimalstuffPreset();

		expect(config.ignorePatterns).toEqual([
			...COMMON_IGNORE_PATTERNS,
			...FORMAT_ONLY_IGNORE_PATTERNS,
		]);
	});

	it('should add the adonisjs ignore patterns when adonisjs is enabled', () => {
		const config = minimalstuffPreset({ adonisjs: true });

		expect(config.ignorePatterns).toEqual([
			...COMMON_IGNORE_PATTERNS,
			...FORMAT_ONLY_IGNORE_PATTERNS,
			...ADONISJS_IGNORE_PATTERNS,
		]);
	});

	it('should append user ignore patterns instead of replacing the defaults when provided', () => {
		const config = minimalstuffPreset({ ignorePatterns: ['tmp/**'] });

		expect(config.ignorePatterns).toEqual([
			...COMMON_IGNORE_PATTERNS,
			...FORMAT_ONLY_IGNORE_PATTERNS,
			'tmp/**',
		]);
	});
});

describe('minimalstuffPreset (oxfmt) with the oxfmt binary', () => {
	let fixture: Fixture;

	afterEach(async () => {
		await fixture.remove();
	});

	it('should sort imports and leave CHANGELOG.md untouched when formatting', async () => {
		fixture = await createFixture({
			'src/a.ts': UNSORTED_IMPORTS_SOURCE,
			'CHANGELOG.md': UNFORMATTED_CHANGELOG,
			'oxfmt.config.ts': `import { minimalstuffPreset } from '${FORMAT_PRESET_PATH}';\n\nexport default minimalstuffPreset();\n`,
		});

		const outcome = await runBinary('oxfmt', fixture.directory, [
			'-c',
			'oxfmt.config.ts',
		]);

		expect(outcome.exitCode).toBe(0);
		expect(await readFile(join(fixture.directory, 'src/a.ts'), 'utf8')).toBe(
			SORTED_IMPORTS_SOURCE
		);
		expect(
			await readFile(join(fixture.directory, 'CHANGELOG.md'), 'utf8')
		).toBe(UNFORMATTED_CHANGELOG);
	});
});

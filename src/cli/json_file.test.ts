import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
	detectIndentation,
	InvalidJsonFileError,
	parseJsonObject,
	readJsonDocument,
	stringifyJson,
	writeJsonDocument,
} from './json_file.ts';

describe('detectIndentation', () => {
	it('should return a tab when the file is indented with tabs', () => {
		expect(detectIndentation('{\n\t"name": "a"\n}')).toBe('\t');
	});

	it('should return two spaces when the file is indented with two spaces', () => {
		expect(detectIndentation('{\n  "name": "a"\n}')).toBe('  ');
	});

	it('should return four spaces when the file is indented with four spaces', () => {
		expect(detectIndentation('{\n    "name": "a"\n}')).toBe('    ');
	});

	it('should return a tab when the file has no indented line', () => {
		expect(detectIndentation('{}')).toBe('\t');
	});

	it('should return a tab when the content is empty', () => {
		expect(detectIndentation('')).toBe('\t');
	});
});

describe('parseJsonObject', () => {
	it('should parse JSONC with comments and trailing commas', () => {
		const raw = '{\n// comment\n"a": 1,\n}';
		expect(parseJsonObject(raw, 'a.json')).toEqual({ a: 1 });
	});

	it('should return an empty object when the content is empty', () => {
		expect(parseJsonObject('', 'a.json')).toEqual({});
	});

	it('should throw an error naming the file when the JSON is invalid', () => {
		expect(() => parseJsonObject('{"a": ', 'broken.json')).toThrow(
			InvalidJsonFileError
		);
		expect(() => parseJsonObject('{"a": ', 'broken.json')).toThrow(
			/broken\.json/
		);
	});

	it('should throw when the root value is not an object', () => {
		expect(() => parseJsonObject('[1]', 'a.json')).toThrow(
			/expected a JSON object/
		);
	});
});

describe('stringifyJson', () => {
	it('should indent with the given indentation and end with a newline', () => {
		expect(stringifyJson({ a: 1 }, '    ')).toBe('{\n    "a": 1\n}\n');
	});
});

describe('json document files', () => {
	let directory: string;

	beforeEach(async () => {
		directory = await mkdtemp(join(tmpdir(), 'json-file-'));
	});

	afterEach(async () => {
		await rm(directory, { recursive: true, force: true });
	});

	it('should preserve the indentation and add a trailing newline when rewriting', async () => {
		const filePath = join(directory, 'package.json');
		await writeFile(filePath, '{\n    "name": "a"\n}');

		const document = await readJsonDocument(filePath);
		await writeJsonDocument(filePath, {
			...document,
			content: { ...document.content, version: '1.0.0' },
		});

		expect(await readFile(filePath, 'utf-8')).toBe(
			'{\n    "name": "a",\n    "version": "1.0.0"\n}\n'
		);
	});
});

import { join } from 'node:path';
import * as p from '@clack/prompts';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';

import type { PromptResult } from './index.js';

const presetPath = fileURLToPath(
	new URL('../../preset/.editorconfig', import.meta.url)
);

export async function updateEditorConfig(result: PromptResult) {
	if (!result.tools.includes('editorconfig')) return;

	const cwd = process.cwd();
	const content = await readFile(presetPath, 'utf-8');
	await writeFile(join(cwd, '.editorconfig'), content, 'utf-8');

	p.log.success('.editorconfig updated');
}

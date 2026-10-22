import { confirm, log } from '@clack/prompts';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { basename } from 'node:path';

import { exitWhenCancelled } from './prompts.ts';

export async function writeGeneratedFile(
	filePath: string,
	content: string
): Promise<boolean> {
	const fileName = basename(filePath);

	if (existsSync(filePath)) {
		const shouldOverwrite = exitWhenCancelled(
			await confirm({ message: `${fileName} already exists. Overwrite it?` })
		);
		if (!shouldOverwrite) {
			log.info(`Skipped ${fileName}`);
			return false;
		}
	}

	await writeFile(filePath, content, 'utf-8');
	log.success(`${fileName} written`);
	return true;
}

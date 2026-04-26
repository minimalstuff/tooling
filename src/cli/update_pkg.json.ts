import { join } from 'node:path';
import * as p from '@clack/prompts';
import { readFile, writeFile } from 'node:fs/promises';

import type { PromptResult } from './index.js';
import { TOOLING_PACKAGE_NAME } from '../constants.js';
import pkgJson from '../../package.json' with { type: 'json' };

type UserPackageJson = {
	devDependencies?: Record<string, string>;
	scripts?: Record<string, string>;
	[key: string]: unknown;
};

export async function updatePkgJson(_: PromptResult) {
	const cwd = process.cwd();
	const pathPackageJSON = join(cwd, 'package.json');
	const raw = await readFile(pathPackageJSON, 'utf-8');
	const userPkgJson = JSON.parse(raw) as UserPackageJson;

	userPkgJson.devDependencies ??= {};
	userPkgJson.devDependencies[TOOLING_PACKAGE_NAME] = `^${pkgJson.version}`;
	userPkgJson.scripts ??= {};

	userPkgJson.scripts.lint = 'oxlint .';
	userPkgJson.scripts['lint:fix'] =
		'oxlint . --fix --fix-suggestions --fix-dangerously';
	userPkgJson.scripts.format = 'pnpm lint:fix; oxfmt .';
	userPkgJson.scripts['format:check'] = 'oxfmt . --check';
	userPkgJson.scripts.typecheck = 'tsc --noEmit';
	userPkgJson.scripts.check =
		'pnpm run lint && pnpm run format:check && pnpm run typecheck';

	await writeFile(pathPackageJSON, JSON.stringify(userPkgJson, null, 2));

	p.log.success('Package.json updated 🤠');
}

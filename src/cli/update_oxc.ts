import { installPackage } from '@antfu/install-pkg';
import * as p from '@clack/prompts';
import {
	type ParseError,
	parse as parseJsonc,
	printParseErrorCode,
} from 'jsonc-parser';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
	OXC_FMT_IMPORT,
	OXC_LINT_IMPORT,
	TOOLING_PACKAGE_NAME,
} from '../constants.js';
import type { PromptResult } from './index.js';

function buildOxlintConfigContent(options: {
	adonisjs: boolean;
	react: boolean;
}) {
	const presetOptions: string[] = [];

	if (options.adonisjs) presetOptions.push('adonisjs: true');
	if (options.react) presetOptions.push('react: true');

	const presetCall =
		presetOptions.length > 0
			? `minimalstuffPreset({ ${presetOptions.join(', ')} })`
			: 'minimalstuffPreset()';

	return `import { minimalstuffPreset } from '${OXC_LINT_IMPORT}'

export default ${presetCall}
`;
}

function buildOxfmtConfigContent(options: { adonisjs: boolean }) {
	const presetCall = options.adonisjs
		? 'minimalstuffPreset({ adonisjs: true })'
		: 'minimalstuffPreset()';

	return `import { minimalstuffPreset } from '${OXC_FMT_IMPORT}'

export default ${presetCall}
`;
}

const vscodeSettings = {
	'oxc.typeAware': true,
	'editor.defaultFormatter': 'oxc.oxc-vscode',
};

const oxcScripts = {
	lint: 'oxlint .',
	'lint:fix': 'oxlint . --fix --fix-suggestions --fix-dangerously',
	format: 'pnpm lint:fix; oxfmt .',
	'format:check': 'oxfmt . --check',
	typecheck: 'tsc --noEmit',
	check: 'pnpm run lint && pnpm run format:check && pnpm run typecheck',
};

const oxcPackages = [
	'oxfmt',
	'oxlint',
	'oxlint-tsgolint',
	TOOLING_PACKAGE_NAME,
];

export async function updateOxc(result: PromptResult) {
	if (!result.tools.includes('oxc')) return;

	const cwd = process.cwd();
	const projectType = await getProjectType(cwd);

	await writeFile(
		join(cwd, 'oxlint.config.ts'),
		buildOxlintConfigContent(projectType)
	);
	await writeFile(
		join(cwd, 'oxfmt.config.ts'),
		buildOxfmtConfigContent(projectType)
	);

	if (result.tools.includes('vscode')) await updateVscodeSettings(cwd);
	await addScriptsToPackageJson(cwd);
	await installPackage(oxcPackages, { dev: true, cwd });

	p.log.success('OXC configured (oxlint + oxfmt) 🦀');
}

type ProjectPackageJson = {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	[key: string]: unknown;
};

function hasAdonisDependency(deps?: Record<string, string>) {
	if (!deps) return false;

	return Object.keys(deps).some((name) => name.startsWith('@adonisjs/'));
}

function hasReactDependency(deps?: Record<string, string>) {
	if (!deps) return false;

	return (
		'react' in deps ||
		'react-dom' in deps ||
		'@types/react' in deps ||
		'@types/react-dom' in deps
	);
}

async function getProjectType(cwd: string) {
	const pkgPath = join(cwd, 'package.json');
	const raw = await readFile(pkgPath, 'utf-8');
	const pkg = JSON.parse(raw) as ProjectPackageJson;

	const adonisjs =
		hasAdonisDependency(pkg.dependencies) ||
		hasAdonisDependency(pkg.devDependencies) ||
		hasAdonisDependency(pkg.peerDependencies);

	const react =
		hasReactDependency(pkg.dependencies) ||
		hasReactDependency(pkg.devDependencies) ||
		hasReactDependency(pkg.peerDependencies);

	return { adonisjs, react };
}

async function updateVscodeSettings(cwd: string) {
	const vscodePath = join(cwd, '.vscode');
	const settingsPath = join(vscodePath, 'settings.json');

	if (!existsSync(vscodePath)) await mkdir(vscodePath);

	let settings: Record<string, unknown> = {};
	if (existsSync(settingsPath)) {
		const content = await readFile(settingsPath, 'utf-8');
		const parseErrors: ParseError[] = [];
		const parsed = parseJsonc(content, parseErrors, {
			allowTrailingComma: true,
			allowEmptyContent: true,
		});
		if (parseErrors.length > 0) {
			const detail = parseErrors
				.map((e) => `${printParseErrorCode(e.error)} @${e.offset}`)
				.join(', ');
			throw new SyntaxError(`Invalid JSONC in ${settingsPath}: ${detail}`);
		}
		if (
			parsed !== null &&
			parsed !== undefined &&
			typeof parsed === 'object' &&
			!Array.isArray(parsed)
		) {
			settings = parsed as Record<string, unknown>;
		}
	}

	for (const [key, value] of Object.entries(vscodeSettings)) {
		if (!(key in settings)) settings[key] = value;
	}

	await writeFile(settingsPath, JSON.stringify(settings, null, 2));
}

type PackageJsonForScripts = {
	scripts?: Record<string, string>;
	[key: string]: unknown;
};

async function addScriptsToPackageJson(cwd: string) {
	const pkgPath = join(cwd, 'package.json');
	const raw = await readFile(pkgPath, 'utf-8');
	const pkg = JSON.parse(raw) as PackageJsonForScripts;

	pkg.scripts ??= {};
	for (const [key, value] of Object.entries(oxcScripts))
		pkg.scripts[key] = value;

	await writeFile(pkgPath, JSON.stringify(pkg, null, 2));
}

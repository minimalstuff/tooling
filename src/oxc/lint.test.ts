import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { minimalstuffPreset } from '#oxc/lint.ts';
import {
	ADONISJS_IGNORE_PATTERNS,
	COMMON_IGNORE_PATTERNS,
} from '#oxc/shared.ts';
import {
	LINT_PRESET_PATH,
	createFixture,
	runBinary,
	type Fixture,
} from '#oxc/test_utils.ts';

const DEBUGGER_SOURCE = 'debugger;\nexport const value = 1;\n';
const HOOK_IN_CONDITION_SOURCE = `import { useState } from 'react';

export function Component({ isOpen }: { isOpen: boolean }) {
	if (isOpen) {
		useState(0);
	}
	return null;
}
`;

const RELATIVE_IMPORT_SOURCE =
	"import { a } from './a.ts';\n\nexport const b = a;\n";
const ALLOWED_EXPORT_SOURCE = 'export const a = 1;\n';

const INJECTED_SERVICE_SOURCE = 'export class CacheService {}\n';
const INJECTED_CONTROLLER_SOURCE = `import { CacheService } from './cache_service.ts';

export class ShowUserController {
	constructor(protected cacheService: CacheService) {}
}
`;

const AWAIT_IN_LOOP_SOURCE = `export async function run(items: string[]): Promise<void> {
	for (const item of items) {
		await Promise.resolve(item);
	}
}
`;
const MIXED_EXPORTS_SOURCE = `export function Component() {
	return null;
}

export const helper = () => 1;
`;
const WRONG_PARAM_NAMES_SOURCE = `export const pending = new Promise<void>((done) => {
	done();
});
`;

function collectRules(
	config: ReturnType<typeof minimalstuffPreset>
): Record<string, unknown> {
	const presetRules = (config.extends ?? []).map((part) =>
		typeof part === 'string' ? {} : (part.rules ?? {})
	);
	return Object.assign({}, ...presetRules, config.rules);
}

function collectPlugins(
	config: ReturnType<typeof minimalstuffPreset>
): string[] {
	const presetPlugins = (config.extends ?? []).flatMap((part) =>
		typeof part === 'string' ? [] : (part.plugins ?? [])
	);
	return [...presetPlugins, ...(config.plugins ?? [])];
}

describe('minimalstuffPreset (oxlint) config', () => {
	it('should include the common ignore patterns when no option is given', () => {
		const config = minimalstuffPreset();

		expect(config.ignorePatterns).toEqual([...COMMON_IGNORE_PATTERNS]);
	});

	it('should add the adonisjs ignore patterns when adonisjs is enabled', () => {
		const config = minimalstuffPreset({ adonisjs: true });

		expect(config.ignorePatterns).toEqual([
			...COMMON_IGNORE_PATTERNS,
			...ADONISJS_IGNORE_PATTERNS,
		]);
	});

	it('should append user ignore patterns after the defaults when provided', () => {
		const config = minimalstuffPreset({ ignorePatterns: ['tmp/**'] });

		expect(config.ignorePatterns).toEqual([
			...COMMON_IGNORE_PATTERNS,
			'tmp/**',
		]);
	});

	it('should let a user rule override a preset rule when both are defined', () => {
		const config = minimalstuffPreset({
			rules: { 'typescript/no-floating-promises': 'off' },
		});

		const baseRules = (config.extends ?? []).map((part) =>
			typeof part === 'string' ? {} : part.rules
		);
		expect(baseRules[0]).toHaveProperty(
			'typescript/no-floating-promises',
			'error'
		);
		expect(config.rules).toHaveProperty(
			'typescript/no-floating-promises',
			'off'
		);
	});

	it('should place user overrides after preset overrides when both exist', () => {
		const userOverride = { files: ['**/*.test.ts'], rules: {} };
		const config = minimalstuffPreset({
			adonisjs: true,
			react: true,
			overrides: [userOverride],
		});

		const presetOverrides = (config.extends ?? []).flatMap((part) =>
			typeof part === 'string' ? [] : (part.overrides ?? [])
		);
		expect(presetOverrides).toHaveLength(4);
		expect(config.overrides).toEqual([userOverride]);
	});

	it('should keep user extends after the preset parts when provided', () => {
		const userExtension = { rules: { 'no-console': 'warn' as const } };
		const config = minimalstuffPreset({ extends: [userExtension] });

		expect(config.extends?.at(-1)).toBe(userExtension);
	});

	it('should keep user plugins at the root when provided', () => {
		const config = minimalstuffPreset({ plugins: ['import'] });

		expect(config.plugins).toEqual(['import']);
	});

	it('should restrict relative imports when no option is given', () => {
		expect(collectRules(minimalstuffPreset())).toHaveProperty(
			'no-restricted-imports'
		);
	});

	it('should not restrict relative imports when subpathImports is false', () => {
		const config = minimalstuffPreset({ subpathImports: false });

		expect(collectRules(config)).not.toHaveProperty('no-restricted-imports');
	});

	it('should let a user no-restricted-imports rule win over the preset when both are defined', () => {
		const config = minimalstuffPreset({
			rules: { 'no-restricted-imports': 'off' },
		});

		expect(collectRules(config)).toHaveProperty('no-restricted-imports', 'off');
	});

	it('should not include react parts when react is disabled', () => {
		const config = minimalstuffPreset();

		expect(collectRules(config)).not.toHaveProperty('react/rules-of-hooks');
		expect(collectPlugins(config)).not.toContain('react');
	});

	it('should include react parts when react is enabled', () => {
		const config = minimalstuffPreset({ react: true });

		expect(collectRules(config)).toHaveProperty(
			'react/rules-of-hooks',
			'error'
		);
		expect(collectPlugins(config)).toEqual(
			expect.arrayContaining(['react', 'jsx-a11y'])
		);
	});

	it('should not include the vitest plugin when vitest is disabled', () => {
		expect(collectPlugins(minimalstuffPreset())).not.toContain('vitest');
	});

	it('should include the vitest plugin when vitest is enabled', () => {
		expect(collectPlugins(minimalstuffPreset({ vitest: true }))).toContain(
			'vitest'
		);
	});

	it('should not include adonisjs rules when adonisjs is disabled', () => {
		const config = minimalstuffPreset({ react: true });

		expect(collectRules(config)).not.toHaveProperty(
			'@adonisjs/prefer-lazy-controller-import'
		);
	});

	it('should include adonisjs rules when adonisjs is enabled', () => {
		const config = minimalstuffPreset({ adonisjs: true });

		expect(collectRules(config)).toHaveProperty(
			'@adonisjs/prefer-lazy-controller-import',
			'error'
		);
	});

	it('should replace the base no-floating-promises rule when adonisjs is enabled', () => {
		const config = minimalstuffPreset({ adonisjs: true });

		const [level, floatingPromisesOptions] = collectRules(config)[
			'typescript/no-floating-promises'
		] as [string, object];
		expect(level).toBe('error');
		expect(floatingPromisesOptions).toHaveProperty('allowForKnownSafePromises');
	});

	it('should not include inertia overrides when only adonisjs is enabled', () => {
		const config = minimalstuffPreset({ adonisjs: true });

		const presetOverrides = (config.extends ?? []).flatMap((part) =>
			typeof part === 'string' ? [] : (part.overrides ?? [])
		);
		expect(presetOverrides).toHaveLength(2);
		expect(presetOverrides[0]?.rules).toHaveProperty('no-await-in-loop', 'off');
		expect(presetOverrides[1]?.rules).toHaveProperty(
			'typescript/consistent-type-imports',
			'off'
		);
	});

	it('should include inertia overrides when adonisjs and react are enabled', () => {
		const config = minimalstuffPreset({ adonisjs: true, react: true });

		const presetOverrides = (config.extends ?? []).flatMap((part) =>
			typeof part === 'string' ? [] : (part.overrides ?? [])
		);
		expect(presetOverrides[3]?.rules).toHaveProperty(
			'@adonisjs/no-backend-import-in-frontend',
			'error'
		);
	});
});

describe('minimalstuffPreset (oxlint) with the oxlint binary', () => {
	let fixture: Fixture;

	afterEach(async () => {
		await fixture.remove();
	});

	async function lintFixture(
		configOptions: string,
		files: Record<string, string>
	): ReturnType<typeof runBinary> {
		fixture = await createFixture({
			...files,
			'oxlint.config.ts': `import { minimalstuffPreset } from '${LINT_PRESET_PATH}';\n\nexport default minimalstuffPreset(${configOptions});\n`,
		});
		return runBinary('oxlint', fixture.directory, ['-c', 'oxlint.config.ts']);
	}

	it('should not lint routeTree.gen.ts when it contains violations', async () => {
		const outcome = await lintFixture('{}', {
			'src/routeTree.gen.ts': DEBUGGER_SOURCE,
		});

		expect(outcome.exitCode).toBe(0);
		expect(outcome.output).not.toContain('no-debugger');
	});

	it('should not lint .adonisjs files when adonisjs is enabled', async () => {
		const outcome = await lintFixture('{ adonisjs: true }', {
			'.adonisjs/server/routes.ts': DEBUGGER_SOURCE,
		});

		expect(outcome.exitCode).toBe(0);
	});

	it('should lint .adonisjs files when adonisjs is disabled', async () => {
		const outcome = await lintFixture('{}', {
			'.adonisjs/server/routes.ts': DEBUGGER_SOURCE,
		});

		expect(outcome.exitCode).not.toBe(0);
	});

	it('should not report consistent-type-imports in app when adonisjs is enabled', async () => {
		const outcome = await lintFixture('{ adonisjs: true }', {
			'app/cache_service.ts': INJECTED_SERVICE_SOURCE,
			'app/show_user_controller.ts': INJECTED_CONTROLLER_SOURCE,
		});

		expect(outcome.output).not.toContain('consistent-type-imports');
	});

	it('should not report consistent-type-imports in a monorepo app when adonisjs is enabled', async () => {
		const outcome = await lintFixture('{ adonisjs: true }', {
			'apps/api/app/cache_service.ts': INJECTED_SERVICE_SOURCE,
			'apps/api/app/show_user_controller.ts': INJECTED_CONTROLLER_SOURCE,
		});

		expect(outcome.output).not.toContain('consistent-type-imports');
	});

	it('should keep the value import when oxlint --fix runs in app with adonisjs enabled', async () => {
		await lintFixture('{ adonisjs: true }', {
			'app/cache_service.ts': INJECTED_SERVICE_SOURCE,
			'app/show_user_controller.ts': INJECTED_CONTROLLER_SOURCE,
		});
		await runBinary('oxlint', fixture.directory, [
			'-c',
			'oxlint.config.ts',
			'--fix',
		]);

		const content = await readFile(
			join(fixture.directory, 'app/show_user_controller.ts'),
			'utf8'
		);
		expect(content).toContain('import { CacheService }');
		expect(content).not.toContain('import type');
	});

	it('should report consistent-type-imports outside the adonisjs server folders', async () => {
		const outcome = await lintFixture('{ adonisjs: true }', {
			'src/cache_service.ts': INJECTED_SERVICE_SOURCE,
			'src/show_user_controller.ts': INJECTED_CONTROLLER_SOURCE,
		});

		expect(outcome.output).toContain('consistent-type-imports');
	});

	it('should report consistent-type-imports in app when adonisjs is disabled', async () => {
		const outcome = await lintFixture('{}', {
			'app/cache_service.ts': INJECTED_SERVICE_SOURCE,
			'app/show_user_controller.ts': INJECTED_CONTROLLER_SOURCE,
		});

		expect(outcome.output).toContain('consistent-type-imports');
	});

	it('should not lint user ignored files when ignorePatterns is provided', async () => {
		const outcome = await lintFixture("{ ignorePatterns: ['tmp/**'] }", {
			'tmp/generated.ts': DEBUGGER_SOURCE,
		});

		expect(outcome.exitCode).toBe(0);
	});

	it('should exit with a non-zero code when a correctness rule is violated', async () => {
		const outcome = await lintFixture('{}', { 'src/a.ts': DEBUGGER_SOURCE });

		expect(outcome.exitCode).not.toBe(0);
		expect(outcome.output).toContain('no-debugger');
	});

	it('should report rules-of-hooks when react is enabled', async () => {
		const outcome = await lintFixture('{ react: true }', {
			'src/component.tsx': HOOK_IN_CONDITION_SOURCE,
		});

		expect(outcome.exitCode).not.toBe(0);
		expect(outcome.output).toContain('rules-of-hooks');
	});

	it('should report only-export-components when a component file also exports a function', async () => {
		const outcome = await lintFixture('{ react: true }', {
			'src/render.tsx': MIXED_EXPORTS_SOURCE,
		});

		expect(outcome.output).toContain('only-export-components');
	});

	it('should not report only-export-components when the file is under a tests directory', async () => {
		const outcome = await lintFixture('{ react: true }', {
			'tests/render.tsx': MIXED_EXPORTS_SOURCE,
		});

		expect(outcome.output).not.toContain('only-export-components');
	});

	it('should not report only-export-components when the file is a spec file', async () => {
		const outcome = await lintFixture('{ react: true }', {
			'src/render.spec.tsx': MIXED_EXPORTS_SOURCE,
		});

		expect(outcome.output).not.toContain('only-export-components');
	});

	it('should not report rules-of-hooks when react is disabled', async () => {
		const outcome = await lintFixture('{}', {
			'src/component.tsx': HOOK_IN_CONDITION_SOURCE,
		});

		expect(outcome.output).not.toContain('rules-of-hooks');
	});

	it('should report no-await-in-loop when an await sits in a loop of a source file', async () => {
		const outcome = await lintFixture('{}', {
			'src/a.ts': AWAIT_IN_LOOP_SOURCE,
		});

		expect(outcome.output).toContain('no-await-in-loop');
	});

	it('should not report no-await-in-loop when the file is a test file', async () => {
		const outcome = await lintFixture('{}', {
			'src/a.test.ts': AWAIT_IN_LOOP_SOURCE,
		});

		expect(outcome.output).not.toContain('no-await-in-loop');
	});

	it('should not report no-await-in-loop when the file is under a tests directory', async () => {
		const outcome = await lintFixture('{}', {
			'tests/a.ts': AWAIT_IN_LOOP_SOURCE,
		});

		expect(outcome.output).not.toContain('no-await-in-loop');
	});

	it('should report promise/param-names when the executor params are misnamed', async () => {
		const outcome = await lintFixture('{}', {
			'src/a.ts': WRONG_PARAM_NAMES_SOURCE,
		});

		expect(outcome.exitCode).not.toBe(0);
		expect(outcome.output).toContain('param-names');
	});

	it('should let the user rule win when it turns off a correctness rule', async () => {
		const outcome = await lintFixture("{ rules: { 'no-debugger': 'off' } }", {
			'src/a.ts': DEBUGGER_SOURCE,
		});

		expect(outcome.exitCode).toBe(0);
	});

	it('should report relative imports when subpathImports is not set', async () => {
		const outcome = await lintFixture('{}', {
			'src/a.ts': ALLOWED_EXPORT_SOURCE,
			'src/b.ts': RELATIVE_IMPORT_SOURCE,
		});

		expect(outcome.exitCode).not.toBe(0);
		expect(outcome.output).toContain('no-restricted-imports');
	});

	it('should not report relative imports when subpathImports is false', async () => {
		const outcome = await lintFixture('{ subpathImports: false }', {
			'src/a.ts': ALLOWED_EXPORT_SOURCE,
			'src/b.ts': RELATIVE_IMPORT_SOURCE,
		});

		expect(outcome.output).not.toContain('no-restricted-imports');
		expect(outcome.exitCode).toBe(0);
	});
});

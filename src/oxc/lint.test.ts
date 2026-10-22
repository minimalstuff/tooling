import { afterEach, describe, expect, it } from 'vitest';

import { minimalstuffPreset } from './lint.ts';
import { ADONISJS_IGNORE_PATTERNS, COMMON_IGNORE_PATTERNS } from './shared.ts';
import {
	LINT_PRESET_PATH,
	createFixture,
	runBinary,
	type Fixture,
} from './test_utils.ts';

const DEBUGGER_SOURCE = 'debugger;\nexport const value = 1;\n';
const HOOK_IN_CONDITION_SOURCE = `import { useState } from 'react';

export function Component({ isOpen }: { isOpen: boolean }) {
	if (isOpen) {
		useState(0);
	}
	return null;
}
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
		expect(presetOverrides).toHaveLength(1);
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
		expect(presetOverrides).toEqual([]);
	});

	it('should include inertia overrides when adonisjs and react are enabled', () => {
		const config = minimalstuffPreset({ adonisjs: true, react: true });

		const presetOverrides = (config.extends ?? []).flatMap((part) =>
			typeof part === 'string' ? [] : (part.overrides ?? [])
		);
		expect(presetOverrides[0]?.rules).toHaveProperty(
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

	it('should not report rules-of-hooks when react is disabled', async () => {
		const outcome = await lintFixture('{}', {
			'src/component.tsx': HOOK_IN_CONDITION_SOURCE,
		});

		expect(outcome.output).not.toContain('rules-of-hooks');
	});

	it('should let the user rule win when it turns off a correctness rule', async () => {
		const outcome = await lintFixture("{ rules: { 'no-debugger': 'off' } }", {
			'src/a.ts': DEBUGGER_SOURCE,
		});

		expect(outcome.exitCode).toBe(0);
	});
});

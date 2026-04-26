import { type DummyRuleMap, type OxlintConfig, defineConfig } from 'oxlint';

import { IGNORE_PATTERNS } from './shared.ts';

export const ADONISJS_DEFAULT_IGNORE_PATTERNS = [
	'.adonisjs/**',
	'pnpm-*.yaml',
	'bin/*',
];

const STRICT_TYPE_AWARE_RULES = {
	'typescript/await-thenable': 'error',
	'typescript/no-floating-promises': 'error',
	'typescript/no-misused-promises': 'error',
	'typescript/no-unnecessary-condition': 'off',
	'typescript/no-unnecessary-type-assertion': 'error',
	'typescript/no-unsafe-argument': 'off',
	'typescript/no-unsafe-assignment': 'off',
	'typescript/no-unsafe-call': 'off',
	'typescript/no-unsafe-member-access': 'off',
	'typescript/no-unsafe-return': 'off',
	'typescript/prefer-nullish-coalescing': 'error',
	'typescript/prefer-optional-chain': 'error',
	'typescript/strict-boolean-expressions': 'off',
	'typescript/switch-exhaustiveness-check': 'off',
};

interface MinimalstuffOxlintConfig {
	adonisjs?: boolean;
	perfectionist?: boolean;
	react?: boolean;
}

function reactPreset() {
	return defineConfig({
		plugins: ['react', 'react-perf'],
		rules: {},
	});
}

function adonisjsPreset() {
	return defineConfig({
		jsPlugins: ['@adonisjs/eslint-plugin'],
		rules: {
			'@adonisjs/prefer-lazy-controller-import': 'error',
			'@adonisjs/prefer-lazy-listener-import': 'error',
			'typescript/triple-slash-reference': 'off',
			'@typescript-eslint/no-floating-promises': [
				'error',
				{
					allowForKnownSafePromises: [
						{
							from: 'package',
							package: '@adonisjs/lucid',
							name: [
								'ExcutableQueryBuilderContract',
								'ModelQueryBuilderContract',
								'DatabaseQueryBuilderContract',
								'InsertQueryBuilderContract',
								'RawQueryBuilderContract',
								'ChainableContract',
								'RelationQueryBuilderContract',
								'RelationSubQueryBuilderContract',
								'HasManyQueryBuilderContract',
								'HasManyThroughQueryBuilderContract',
								'ManyToManyQueryBuilderContract',
								'ManyToManySubQueryBuilderContract',
							],
						},
						{ from: 'package', package: 'knex', name: 'QueryBuilder' },
					],
				},
			],
		},
	});
}

function perfectionistPreset() {
	return defineConfig({
		jsPlugins: ['eslint-plugin-perfectionist'],
		rules: {
			'perfectionist/sort-imports': [
				'error',
				{
					type: 'line-length',
					order: 'asc',
					internalPattern: ['^@/.*', '^~/.*'],
					groups: [
						['side-effect', 'side-effect-style'],
						['builtin', 'external'],
						[
							'internal',
							'subpath',
							'parent',
							'sibling',
							'index',
							'style',
							'unknown',
						],
					],
				},
			],
		},
	});
}

function defaultPreset() {
	return defineConfig({
		ignorePatterns: IGNORE_PATTERNS,
		plugins: ['typescript', 'node', 'eslint', 'oxc'],
		rules: { ...STRICT_TYPE_AWARE_RULES } as DummyRuleMap,
		options: {
			typeAware: true,
			typeCheck: true,
		},
	});
}

export function minimalstuffPreset(config: MinimalstuffOxlintConfig = {}) {
	const normalizedConfig: MinimalstuffOxlintConfig = {
		perfectionist: true,
		...config,
	};

	return defineConfig({
		extends: [
			defaultPreset(),
			normalizedConfig.react ? reactPreset() : null,
			normalizedConfig.adonisjs ? adonisjsPreset() : null,
			normalizedConfig.perfectionist ? perfectionistPreset() : null,
		].filter(Boolean) as OxlintConfig[],
		rules: {},
	});
}

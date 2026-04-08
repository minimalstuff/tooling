import { type OxlintConfig, defineConfig } from 'oxlint';

import { IGNORE_PATTERNS } from './shared.ts';

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
		rules: {},
		options: {
			typeAware: true,
		},
	});
}

export function minimalstuffPreset(config: MinimalstuffOxlintConfig = {}) {
	return defineConfig({
		extends: [
			defaultPreset(),
			config.react ? reactPreset() : null,
			config.adonisjs ? adonisjsPreset() : null,
			config.perfectionist ? perfectionistPreset() : null,
		].filter(Boolean) as OxlintConfig[],
		rules: {},
	});
}

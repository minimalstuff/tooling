import { type OxlintConfig, defineConfig } from 'oxlint';

import { ADONISJS_IGNORE_PATTERNS, COMMON_IGNORE_PATTERNS } from './shared.ts';

const INERTIA_FRONTEND_FILES = ['**/inertia/**/*.{ts,tsx}'];

export interface MinimalstuffOxlintOptions extends OxlintConfig {
	/** Enable React rules (hooks, fast refresh) and accessibility checks. */
	react?: boolean;
	/** Enable AdonisJS rules and ignore patterns. */
	adonisjs?: boolean;
	/** Enable the vitest plugin. */
	vitest?: boolean;
}

function createBasePreset(): OxlintConfig {
	return defineConfig({
		plugins: ['typescript', 'unicorn', 'oxc'],
		categories: { correctness: 'error' },
		options: { typeAware: true, typeCheck: true },
		rules: {
			'typescript/await-thenable': 'error',
			'typescript/no-floating-promises': 'error',
			'typescript/no-misused-promises': 'error',
			'typescript/no-unnecessary-type-assertion': 'error',
			'typescript/prefer-nullish-coalescing': 'error',
			'typescript/prefer-optional-chain': 'error',
			'typescript/switch-exhaustiveness-check': 'error',
			'typescript/only-throw-error': 'error',
			'typescript/return-await': 'error',
			'typescript/prefer-promise-reject-errors': 'error',
			'typescript/consistent-type-imports': 'error',
			'typescript/no-deprecated': 'warn',
		},
	});
}

function createReactPreset(): OxlintConfig {
	return defineConfig({
		plugins: ['react', 'jsx-a11y'],
		rules: {
			'react/rules-of-hooks': 'error',
			'react/only-export-components': ['warn', { allowConstantExport: true }],
		},
	});
}

function createVitestPreset(): OxlintConfig {
	return defineConfig({ plugins: ['vitest'] });
}

function createAdonisjsPreset(): OxlintConfig {
	return defineConfig({
		jsPlugins: ['@adonisjs/eslint-plugin'],
		rules: {
			'@adonisjs/prefer-lazy-controller-import': 'error',
			'@adonisjs/prefer-lazy-listener-import': 'error',
			'typescript/triple-slash-reference': 'off',
			'typescript/no-floating-promises': [
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

function createInertiaPreset(): OxlintConfig {
	return defineConfig({
		overrides: [
			{
				files: INERTIA_FRONTEND_FILES,
				rules: {
					'@adonisjs/no-backend-import-in-frontend': 'error',
					'@adonisjs/prefer-adonisjs-inertia-link': 'error',
					'@adonisjs/prefer-adonisjs-inertia-form': 'error',
				},
			},
		],
	});
}

function createPresets(options: {
	react: boolean;
	adonisjs: boolean;
	vitest: boolean;
}): OxlintConfig[] {
	const presets = [createBasePreset()];
	if (options.react) presets.push(createReactPreset());
	if (options.vitest) presets.push(createVitestPreset());
	if (options.adonisjs) presets.push(createAdonisjsPreset());
	if (options.adonisjs && options.react) presets.push(createInertiaPreset());
	return presets;
}

function createIgnorePatterns(
	isAdonisjsEnabled: boolean,
	userIgnorePatterns: readonly string[]
): string[] {
	return [
		...COMMON_IGNORE_PATTERNS,
		...(isAdonisjsEnabled ? ADONISJS_IGNORE_PATTERNS : []),
		...userIgnorePatterns,
	];
}

/**
 * Builds the root oxlint config: preset parts are placed in `extends` before the
 * user's own `extends`, while the user's keys sit on top (rules override,
 * overrides and plugins are appended). `ignorePatterns` are always merged at the
 * root because oxlint does not inherit them through `extends`.
 */
export function minimalstuffPreset(
	options: MinimalstuffOxlintOptions = {}
): OxlintConfig {
	const {
		react = false,
		adonisjs = false,
		vitest = false,
		extends: userExtends = [],
		ignorePatterns: userIgnorePatterns = [],
		...userConfig
	} = options;

	return defineConfig({
		...userConfig,
		extends: [...createPresets({ react, adonisjs, vitest }), ...userExtends],
		ignorePatterns: createIgnorePatterns(adonisjs, userIgnorePatterns),
	});
}

import type { WorkspaceProjectConfig } from 'knip';

export const ADONISJS_WORKSPACE_CONFIG: Readonly<WorkspaceProjectConfig> = {
	entry: [
		'adonisrc.ts',
		'ace.js',
		'bin/*.ts',
		'start/**/*.ts',
		'config/**/*.ts',
		'providers/**/*.ts',
		'commands/**/*.ts',
		'database/migrations/**/*.ts',
		'database/seeders/**/*.ts',
		'database/factories/**/*.ts',
		'tests/bootstrap.ts',
		'tests/**/*.spec.{ts,js}',
		'app/**/*.spec.{ts,js}',
		'inertia/{app,ssr}.{ts,tsx}',
		'inertia/app/{app,ssr}.{ts,tsx}',
		'inertia/pages/**/*.{ts,tsx}',
	],
	project: ['**/*.{ts,tsx,js}'],
	ignore: ['.adonisjs/**', 'database/schema.ts'],
	ignoreDependencies: [
		'pg',
		'mysql2',
		'better-sqlite3',
		'sqlite3',
		'pino-pretty',
		'hot-hook',
	],
};

const ENV_DOCUMENT = `---
lockfileVersion: '9.0'

importers:

  .:
    configDependencies: {}
    packageManagerDependencies:
      pnpm:
        specifier: 12.16.1
        version: 12.16.1

packages:

  pnpm@12.16.1:
    resolution: {integrity: sha512-abc}

snapshots:

  pnpm@12.16.1: {}

---
`;

type LockfileOptions = {
	patchedDependencies?: Record<string, string>;
	overrides?: Record<string, string>;
	importers?: Record<string, Record<string, Record<string, string>>>;
};

function renderMapping(
	name: string,
	entries: Record<string, string> | undefined
): string {
	if (!entries || Object.keys(entries).length === 0) return '';
	const lines = Object.entries(entries).map(
		([key, value]) => `  '${key}': '${value}'`
	);
	return `${name}:\n${lines.join('\n')}\n\n`;
}

function renderImporter(
	importerPath: string,
	fields: Record<string, Record<string, string>>
): string {
	const renderedFields = Object.entries(fields).map(([field, dependencies]) => {
		const renderedDependencies = Object.entries(dependencies).map(
			([name, version]) =>
				`      '${name}':\n        specifier: '*'\n        version: '${version}'`
		);
		return `    ${field}:\n${renderedDependencies.join('\n')}`;
	});
	return `  '${importerPath}':\n${renderedFields.join('\n')}\n`;
}

export function buildLockfile(options: Readonly<LockfileOptions> = {}): string {
	const importers = options.importers ?? { '.': {} };
	const renderedImporters = Object.entries(importers)
		.map(([importerPath, fields]) => renderImporter(importerPath, fields))
		.join('\n');

	return [
		ENV_DOCUMENT,
		"lockfileVersion: '9.0'\n\n",
		'settings:\n  autoInstallPeers: true\n  excludeLinksFromLockfile: false\n\n',
		renderMapping('overrides', options.overrides),
		renderMapping('patchedDependencies', options.patchedDependencies),
		`importers:\n\n${renderedImporters}\n`,
	].join('');
}

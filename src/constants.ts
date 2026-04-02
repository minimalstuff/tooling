export const TOOLING_PACKAGE_NAME = '@minimalstuff/tooling'

export const OXC_LINT_IMPORT = `${TOOLING_PACKAGE_NAME}/oxc/lint`
export const OXC_FMT_IMPORT = `${TOOLING_PACKAGE_NAME}/oxc/fmt`

export const EDITORCONFIG_PACKAGE_EXPORT = `${TOOLING_PACKAGE_NAME}/editorconfig`

export const OXC_VSCODE_SETTINGS = {
	'oxc.typeAware': true,
	'oxc.fmt.experimental': true,
	'editor.defaultFormatter': 'oxc.oxc-vscode',
}

export const JSON_INDENT = '\t\t'

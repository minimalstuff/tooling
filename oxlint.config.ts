import { minimalstuffPreset } from '#oxc/lint.ts';

export default minimalstuffPreset({
	vitest: true,
	rules: {
		'no-restricted-imports': [
			'error',
			{
				patterns: [
					{
						group: ['./*', '../*'],
						message:
							'Use a subpath import (#folder/file.ts) instead of a relative path.',
					},
				],
			},
		],
	},
});

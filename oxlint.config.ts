import { defineConfig } from 'oxlint';

import { minimalstuffPreset } from './src/oxc/lint.ts';

export default defineConfig({
	extends: [minimalstuffPreset({ perfectionist: true })],
});

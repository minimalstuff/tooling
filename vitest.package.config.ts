import { defineConfig } from 'vitest/config';

const PACKAGE_TEST_TIMEOUT_MS = 600_000;

export default defineConfig({
	test: {
		include: ['test_package/**/*.test.ts'],
		testTimeout: PACKAGE_TEST_TIMEOUT_MS,
		hookTimeout: PACKAGE_TEST_TIMEOUT_MS,
	},
});

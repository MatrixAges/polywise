import { defineConfig } from '@rstest/core'

export default defineConfig({
	root: './test',
	setupFiles: ['./utils/setup.ts'],
	reporters: ['verbose'],
	source: { decorators: { version: 'legacy' } },
	testTimeout: 30000
})

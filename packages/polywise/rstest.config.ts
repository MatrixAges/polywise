import { resolve } from 'path'
import { defineConfig } from '@rstest/core'

export default defineConfig({
	root: './test',
	setupFiles: ['./utils/setup.ts'],
	reporters: ['verbose'],
	resolve: { alias: { '@': resolve(`${process.cwd()}/src`) } },
	source: { decorators: { version: 'legacy' } },
	hookTimeout: 180000,
	testTimeout: 180000
})

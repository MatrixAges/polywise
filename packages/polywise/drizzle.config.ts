import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	schema: './src/db/schema/index.ts',
	out: './drizzle',
	dialect: 'postgresql'
})

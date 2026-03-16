import { defineConfig } from 'drizzle-kit'

import { app } from './src/consts'

export default defineConfig({
	schema: './src/db/schema/index.ts',
	out: './drizzle',
	dialect: 'sqlite',
	dbCredentials: { url: app.db_path }
})

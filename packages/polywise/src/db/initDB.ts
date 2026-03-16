import { dirname } from 'path'
import { app } from '@core/consts'
import { env } from '@core/env'
import Sqlite from 'better-sqlite3'
import fs from 'fs-extra'
import { load } from 'sqlite-vec'

export default () => {
	fs.ensureDirSync(dirname(app.db_path))

	env.sqlite = new Sqlite(app.db_path)
	env.sqlite.pragma('journal_mode = WAL')
	env.sqlite.pragma('synchronous = NORMAL')
	env.sqlite.pragma('foreign_keys = ON')
	env.sqlite.pragma('temp_store = MEMORY')
	env.sqlite.pragma('cache_size = -64000')
	env.sqlite.pragma('mmap_size = 268435456')

	env.sqlite.exec(`ATTACH DATABASE '${app.vec_path}' AS vec`)

	env.sqlite.exec(`
            PRAGMA vec.journal_mode = WAL;
            PRAGMA vec.synchronous = NORMAL;
            PRAGMA vec.temp_store = MEMORY;
      `)

	load(env.sqlite)
}

import { env } from '@core/env'
import { getId } from 'stk/utils'

export default () => {
	const stmt = env.sqlite.prepare('SELECT id FROM agent WHERE name = ?')
	const exist = stmt.get('global')

	if (!exist) {
		const insert = env.sqlite.prepare(`
            INSERT INTO agent (id, name, soul, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        `)
		const now = Date.now()
		insert.run(getId(), 'global', '', now, now)
	}
}

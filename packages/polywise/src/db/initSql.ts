import { env } from '@core/env'

export default () => {
	env.sqlite.exec(`
		CREATE VIRTUAL TABLE IF NOT EXISTS agent_vec USING vec0(
			vectors float[1024]
		);
	`)

	env.sqlite.exec(`
		CREATE VIRTUAL TABLE IF NOT EXISTS node_vec USING vec0(
			vectors float[1024]
		);
	`)

	env.sqlite.exec(`
		CREATE VIRTUAL TABLE IF NOT EXISTS edge_vec USING vec0(
			vectors float[1024]
		);
	`)

	env.sqlite.exec(`
		CREATE VIRTUAL TABLE IF NOT EXISTS chunk_vec USING vec0(
			vectors float[1024]
		);
	`)
}

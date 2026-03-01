import path from 'path'
import { describe, expect, it } from '@rstest/core'
import dayjs from 'dayjs'
import fs from 'fs-extra'

import { software_architecture_datasets } from './datasets/software'
import withPolywise from './utils/withPolywise'

describe.concurrent('Log module', () => {
	it('should write log files after save and query', async () => {
		const log_dir = path.join(process.cwd(), '.test_logs', String(Date.now()))
		const content_text = software_architecture_datasets[14]

		await withPolywise({
			init_args: {
				log: {
					dir: log_dir,
					log: true,
					json: false
				}
			},
			run_fn: async poly => {
				await poly.save({ content: content_text })
				await poly.query({ query: content_text, threshold: 0 })
			}
		})

		const date_name = dayjs().format('YYYY-MM-DD')
		const log_path = path.join(log_dir, `${date_name}.log`)
		const exists = await fs.pathExists(log_path)

		expect(exists).toBe(true)
	})
})

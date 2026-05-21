import path from 'path'
import { app } from '@core/consts'
import { scanCustomToolsMap } from '@core/fst/tools'
import { p } from '@core/utils'
import { array, object, string } from 'zod'

const output_type = array(
	object({
		name: string(),
		description: string()
	})
)

export default p
	.meta({
		openapi: {
			method: 'GET',
			path: '/tool/query',
			summary: 'List custom tools'
		},
		cli: {
			group: ['tool'],
			name: 'query',
			summary: 'List custom tools.'
		}
	})
	.output(output_type)
	.query(async () => {
		return scanCustomToolsMap(path.resolve(app.app_path, 'tools'))
	})

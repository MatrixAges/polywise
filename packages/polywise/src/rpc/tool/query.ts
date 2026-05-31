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
			description: 'List installed custom tools from the local tools directory.'
		}
	})
	.output(output_type)
	.query(async () => {
		return scanCustomToolsMap(path.resolve(app.app_path, 'tools'))
	})

import path from 'path'
import { app } from '@core/consts'
import { scanCustomToolsMap } from '@core/fst/tools'
import { p } from '@core/utils'

export default p.query(async () => {
	return scanCustomToolsMap(path.resolve(app.app_path, 'tools'))
})

import { p } from '@desktop/utils'
import { app } from 'electron'

export default p.query(async () => {
	app.exit()
})

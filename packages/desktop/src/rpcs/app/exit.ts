import { app } from 'electron'

import { p } from '@desktop/utils'

export default p.query(async () => {
	app.exit()
})

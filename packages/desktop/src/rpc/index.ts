import { router } from '@desktop/utils'

import app from './app'
import memory from './memory'

export const routers = router({
	app,
	memory
})

export type Router = typeof routers

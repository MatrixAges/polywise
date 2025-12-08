import { router } from '@desktop/utils'

import app from './app'

export const routers = router({
	app
})

export type Router = typeof routers

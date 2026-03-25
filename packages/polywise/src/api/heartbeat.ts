import type { HonoContext } from '@core/types'

export default async (c: HonoContext) => {
	return c.json({
		status: 'ok',
		timestamp: Date.now(),
		uptime: process.uptime()
	})
}

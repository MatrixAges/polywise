import os from 'os'

import { p } from '../../utils/trpc'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/file/homedir',
			description: 'Read Homedir'
		}
	})
	.query(() => {
		return os.homedir()
	})

import os from 'os'

import { p } from '../../utils/trpc'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/file/homedir',
			description: 'Return the current user home directory path.'
		}
	})
	.query(() => {
		return os.homedir()
	})

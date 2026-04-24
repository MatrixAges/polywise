import os from 'os'

import { p } from '../../utils/trpc'

export default p.query(() => {
	return os.homedir()
})

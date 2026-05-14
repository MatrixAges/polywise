import { getSnifferStatuses } from '@core/sniffer'

import { p } from '../../utils/trpc'

export default p.query(async () => ({
	browsers: await getSnifferStatuses()
}))

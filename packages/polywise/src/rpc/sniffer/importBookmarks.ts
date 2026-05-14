import { importBrowserBookmarks } from '@core/sniffer'
import { enum as Enum, object } from 'zod'

import { sniffer_browser_ids } from '../../sniffer/types'
import { p } from '../../utils/trpc'

const input_type = object({
	browser: Enum(sniffer_browser_ids)
})

export default p.input(input_type).mutation(async ({ input }) => importBrowserBookmarks(input.browser))

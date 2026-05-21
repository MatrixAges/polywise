import { importBrowserBookmarks } from '@core/sniffer'
import { array, enum as Enum, object, string } from 'zod'

import { sniffer_browser_ids } from '../../sniffer/types'
import { p } from '../../utils/trpc'

const input_type = object({
	browser: Enum(sniffer_browser_ids),
	folder_keys: array(string()).optional()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/sniffer/importBookmarks',
			summary: 'Run Import Bookmarks'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => importBrowserBookmarks(input.browser, { folder_keys: input.folder_keys }))

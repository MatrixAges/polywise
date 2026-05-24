import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import { base_url_service } from '@website/utils/const'
import { request } from '@website/utils/ofetch'

import type { Router } from '@server/rpcs'

const trpc = createTRPCProxyClient<Router>({
	links: [
		httpBatchLink({
			url: base_url_service + '/trpc',
			async fetch(input, options) {
				return request.raw(input as string, options)
			}
		})
	]
})

export default trpc

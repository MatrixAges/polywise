import { createTRPCClient, httpBatchLink, httpSubscriptionLink, splitLink } from '@trpc/client'

import { server_trpc_url } from '@/appdata'

import type { Router } from '@core/index'

export default createTRPCClient<Router>({
	links: [
		splitLink({
			condition: op => op.type === 'subscription',
			true: httpSubscriptionLink({ url: server_trpc_url }),
			false: httpBatchLink({ url: server_trpc_url })
		})
	]
})

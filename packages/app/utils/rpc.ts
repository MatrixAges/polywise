import { createTRPCClient, createWSClient, httpBatchLink, splitLink, wsLink } from '@trpc/client'

import { server_trpc_url, server_ws_url } from '@/appdata'

import type { Router } from '@core/index'

const ws_client = createWSClient({ url: server_ws_url })

export default createTRPCClient<Router>({
	links: [
		splitLink({
			condition: op => op.type === 'subscription',
			true: wsLink({ client: ws_client }),
			false: httpBatchLink({ url: server_trpc_url })
		})
	]
})

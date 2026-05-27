import { createTRPCClient, createWSClient, httpBatchLink, splitLink, wsLink } from '@trpc/client'
import superjson from 'superjson'

import { server_trpc_url, server_ws_url } from '@/appdata'

import type { Router } from '@core/index'

const ws_client = createWSClient({ url: server_ws_url })

export default createTRPCClient<Router>({
	links: [
		splitLink({
			condition: op => op.type === 'subscription',
			true: wsLink({ client: ws_client, transformer: superjson }),
			false: httpBatchLink({
				url: server_trpc_url,
				transformer: superjson,
				fetch: (input, init) =>
					fetch(input, {
						...init,
						credentials: 'include'
					})
			})
		})
	]
})

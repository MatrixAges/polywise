import { createTRPCClient, httpBatchLink } from '@trpc/client'

import { server_trpc_url } from '@/appdata'

import type { Router } from '@core/index'

export default createTRPCClient<Router>({
	links: [httpBatchLink({ url: server_trpc_url })]
})

import { ipcLink } from 'erpc/renderer'

import { createTRPCClient } from '@trpc/client'

import type { Router } from '@desktop/rpcs'

export default createTRPCClient<Router>({
	links: window.$erpc ? [ipcLink()] : []
})

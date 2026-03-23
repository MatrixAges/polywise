import { createTRPCClient } from '@trpc/client'
import { ipcLink } from 'erpc/renderer'

import createUniversalObject from './createUniversalObject'
import { is_electron } from './is'

import type { Router } from '@desktop/rpc'

const ipc = createTRPCClient<Router>({
	links: window.$erpc ? [ipcLink()] : []
})

export default is_electron ? ipc : createUniversalObject<typeof ipc>()

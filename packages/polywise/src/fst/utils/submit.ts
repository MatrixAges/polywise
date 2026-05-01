import { connectSession } from '@core/utils'
import { getId } from 'stk/utils'

import type { ConnectSessionArgs } from '@core/utils/connectSession'

export default async (args: ConnectSessionArgs, text: string) => {
	const session = await connectSession(args)

	await session.getStream({
		id: getId(),
		role: 'user',
		parts: [{ type: 'text', text }]
	})
}

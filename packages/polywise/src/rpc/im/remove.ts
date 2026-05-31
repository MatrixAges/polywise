import { im_account, im_peer_state } from '@core/db/schema'
import { getImAccount, removeImAccount, removeImPeerState } from '@core/db/services'
import { and, eq } from 'drizzle-orm'
import { boolean, object, string } from 'zod'

import { p } from '../../utils/trpc'

const output_type = object({
	ok: boolean()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/im/remove',
			description: 'Run Remove'
		}
	})
	.input(string())
	.output(output_type)
	.mutation(async ({ input }) => {
		const account = await getImAccount(eq(im_account.id, input))

		await removeImAccount(eq(im_account.id, input))

		if (account) {
			await removeImPeerState(
				and(
					eq(im_peer_state.platform, account.platform),
					eq(im_peer_state.account_id, account.account_id)
				)!
			)
		}

		return { ok: true }
	})

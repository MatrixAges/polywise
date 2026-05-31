import { im_account } from '@core/db/schema'
import { getImAccounts } from '@core/db/services'
import { asc } from 'drizzle-orm'
import { array, object } from 'zod'

import { p } from '../../utils/trpc'
import { im_account_schema, normalizeImAccount } from './shared'

const output_type = object({
	accounts: array(im_account_schema)
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/im/query',
			description: 'Read Query'
		}
	})
	.output(output_type)
	.query(async () => {
		const accounts = await getImAccounts({
			orderBy: asc(im_account.created_at)
		})

		return {
			accounts: accounts.map(normalizeImAccount)
		}
	})

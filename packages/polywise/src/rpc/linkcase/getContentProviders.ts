import { p } from '@core/utils'

import { linkcase_content_providers } from './providers'
import { isToolInstalled } from './runtime'

export default p.query(async () => {
	const providers = await Promise.all(
		linkcase_content_providers.map(async item => {
			const installed = await isToolInstalled(item.detect)

			return {
				...item,
				installed
			}
		})
	)

	return { providers }
})

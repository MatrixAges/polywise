import { getAgentByName, insertAgent } from '@core/db/prepare'
import { getId } from 'stk/utils'

export default () => {
	const exist = getAgentByName().get('global')
	if (!exist) {
		const now = Date.now()
		insertAgent().run(getId(), 'global', '', now, now)
	}
}

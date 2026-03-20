import { app } from '@core/consts'
import { getAgentByName, insertAgent } from '@core/db/prepare'
import { getId } from 'stk/utils'

export default () => {
	const exist = getAgentByName().get(app.global_agent_name)

	if (!exist) {
		const now = Date.now()

		insertAgent().run(getId(), app.global_agent_name, '', now, now)
	}
}

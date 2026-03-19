import { on } from 'events'
import { main_emitter, p } from '@desktop/utils'

export default p.subscription(async function* (args) {
	const { signal } = args

	try {
		for await (const [data] of on(main_emitter, 'CHANGE', { signal })) {
			yield data as unknown
		}
	} finally {
	}
})

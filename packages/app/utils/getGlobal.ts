import { container } from 'tsyringe'

import Global from '@/models/Global'

export default (global: Global) => {
	setTimeout(() => (global = container.resolve(Global)), 0)
}

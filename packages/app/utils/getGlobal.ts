import { container } from 'tsyringe'

import { GlobalModel } from '@/context'

export default (global: GlobalModel) => {
	setTimeout(() => (global = container.resolve(GlobalModel)), 0)
}

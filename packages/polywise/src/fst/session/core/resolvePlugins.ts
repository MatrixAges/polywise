import plugins from '../../domains'

import type { Descriptor, Plugin } from './types'

export default (d: Descriptor) =>
	plugins.filter(plugin => plugin.match(d)).sort((a, b) => (a.order || 0) - (b.order || 0)) as Array<Plugin>

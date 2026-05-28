import type { Descriptor } from './types'

const joinTags = (d: Descriptor) => [...d.tags].sort().join(',')

export default (a: Descriptor, b: Descriptor) =>
	a.id === b.id &&
	a.scope.type === b.scope.type &&
	a.scope.id === b.scope.id &&
	a.projectId === b.projectId &&
	a.agentId === b.agentId &&
	a.groupId === b.groupId &&
	joinTags(a) === joinTags(b)

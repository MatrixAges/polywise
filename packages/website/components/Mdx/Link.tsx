import { $ } from '@website/utils'

import type { ComponentPropsWithoutRef } from 'react'

const Index = ({ rel, target, ...props }: ComponentPropsWithoutRef<'a'>) => {
	const resolvedTarget = target ?? '_blank'
	const resolvedRel = resolvedTarget === '_blank' ? [rel, 'noopener', 'noreferrer'].filter(Boolean).join(' ') : rel

	return <a {...props} target={resolvedTarget} rel={resolvedRel} />
}

export default $.memo(Index)

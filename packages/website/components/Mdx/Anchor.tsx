import { $ } from '@website/utils'
import getReactNodeText from '@website/utils/getReactNodeText'

import type { PropsWithChildren } from 'react'

const Index = ({ children }: PropsWithChildren) => {
	const text = getReactNodeText(children)

	return (
		<a id={text} className='anchor absolute' tabIndex={-1} href={`#${text}`}>
			#
		</a>
	)
}

export default $.memo(Index)

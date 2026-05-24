import { $ } from '@website/utils'

import type { PropsWithChildren } from 'react'

const Index = ({ children }: PropsWithChildren) => (
	<a id={children as string} className='anchor absolute' tabIndex={-1} href={`#${children}`}>
		#
	</a>
)

export default $.memo(Index)

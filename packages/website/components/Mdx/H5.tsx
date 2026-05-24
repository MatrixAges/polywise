import { $ } from '@website/utils'

import Anchor from './Anchor'

import type { PropsWithChildren } from 'react'

export const Index = ({ children }: PropsWithChildren) => (
	<h5 className='heading relative'>
		<Anchor>{children}</Anchor>
		{children}
	</h5>
)

export default $.memo(Index)

import { $ } from '@website/utils'

import Anchor from './Anchor'

import type { PropsWithChildren } from 'react'

export const Index = ({ children }: PropsWithChildren) => (
	<h1 className='heading relative'>
		<Anchor>{children}</Anchor>
		{children}
	</h1>
)

export default $.memo(Index)

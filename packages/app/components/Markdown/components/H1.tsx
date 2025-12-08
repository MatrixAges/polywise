import Anchor from './Anchor'

import type { HTMLAttributes } from 'react'

export const Index = ({ id, children }: HTMLAttributes<HTMLHeadingElement>) => (
	<h1 id={id} className='heading relative'>
		<Anchor>{children}</Anchor>
		{children}
	</h1>
)

export default $app.memo(Index)

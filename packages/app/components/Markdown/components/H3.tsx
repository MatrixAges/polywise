import Anchor from './Anchor'

import type { HTMLAttributes } from 'react'

export const Index = ({ id, children }: HTMLAttributes<HTMLHeadingElement>) => (
	<h3 id={id} className='heading relative'>
		<Anchor>{children}</Anchor>
		{children}
	</h3>
)

export default $app.memo(Index)

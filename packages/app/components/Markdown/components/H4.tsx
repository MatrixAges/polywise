import Anchor from './Anchor'

import type { HTMLAttributes } from 'react'

export const Index = ({ id, children }: HTMLAttributes<HTMLHeadingElement>) => (
	<h4 id={id} className='heading relative'>
		<Anchor>{children}</Anchor>
		{children}
	</h4>
)

export default $app.memo(Index)

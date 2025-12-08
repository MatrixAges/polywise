import Anchor from './Anchor'

import type { HTMLAttributes } from 'react'

export const Index = ({ id, children }: HTMLAttributes<HTMLHeadingElement>) => (
	<h6 id={id} className='heading relative'>
		<Anchor>{children}</Anchor>
		{children}
	</h6>
)

export default $app.memo(Index)

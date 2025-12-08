import type { AnchorHTMLAttributes } from 'react'

export const Index = ({ href, children }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
	<a href={href} target={href?.indexOf('#') !== -1 ? '_self' : '_blank'}>
		{children}
	</a>
)

export default $app.memo(Index)

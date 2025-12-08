import Math from './Math'

import type { AnchorHTMLAttributes } from 'react'

export const Index = ({ className, children }: AnchorHTMLAttributes<HTMLElement>) => {
	if (className && className?.indexOf('language-math') !== -1) {
		return <Math inline>{children}</Math>
	}

	return <code>{children}</code>
}

export default $app.memo(Index)

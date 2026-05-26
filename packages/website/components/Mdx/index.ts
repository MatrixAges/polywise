import { createElement } from 'react'

import Alert from './Alert'
import Code from './Code'
import H1 from './H1'
import H2 from './H2'
import H3 from './H3'
import H4 from './H4'
import H5 from './H5'
import H6 from './H6'
import Tabs from './Tabs'
import Video from './Video'

const Row = ({ children, className, ...props }: any) => {
	return createElement(
		'div',
		{
			...props,
			className: ['flex flex-wrap gap-4', className].filter(Boolean).join(' ')
		},
		children
	)
}

const Col = ({ children, className, span, style, ...props }: any) => {
	const basis = typeof span === 'number' ? `${(span / 24) * 100}%` : undefined

	return createElement(
		'div',
		{
			...props,
			className: ['min-w-0 flex-1', className].filter(Boolean).join(' '),
			style: { ...style, flexBasis: basis }
		},
		children
	)
}

export const components = {
	h1: H1,
	h2: H2,
	h3: H3,
	h4: H4,
	h5: H5,
	h6: H6,
	pre: Code,
	Tabs,
	Video,
	Alert,
	Row,
	Col
}

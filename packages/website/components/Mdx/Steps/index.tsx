import { Children, cloneElement, isValidElement } from 'react'
import { $ } from '@website/utils'

import Step from './Step'

import type { PropsWithChildren, ReactElement } from 'react'

interface StepProps {
	step?: number
	is_last?: boolean
}

const isStepElement = (child: unknown): child is ReactElement<StepProps> => isValidElement(child) && child.type === Step

const Index = ({ children }: PropsWithChildren) => {
	const step_children = Children.toArray(children).filter(isStepElement)

	return (
		<div className='my-8 flex flex-col'>
			{step_children.map((child, index) =>
				cloneElement(child, {
					key: child.key ?? index,
					step: index + 1,
					is_last: index === step_children.length - 1
				})
			)}
		</div>
	)
}

export default $.memo(Index)

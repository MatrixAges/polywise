import { Center, Left, Right } from './components'

import styles from './index.module.css'

import type { IPropsHeader } from '@/layout/types'
import type { IPropsRight } from './types'

const Index = (props: IPropsHeader) => {
	const { togglePanel } = props

	const props_right: IPropsRight = {
		togglePanel
	}

	return (
		<div
			className={`
				relative
				flex
				items-center justify-center
				w-full h-[43px]
				border-border-dev border-b
				${styles._local}
			`}
		>
			<Left></Left>
			<Center></Center>
			<Right {...props_right}></Right>
		</div>
	)
}

export default $app.memo(Index)

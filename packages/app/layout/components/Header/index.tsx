import { Center, Left, Right } from './components'

import styles from './index.module.css'

import type { IPropsHeader } from '@/layout/types'
import type { IPropsLeft, IPropsRight } from './types'

const Index = (props: IPropsHeader) => {
	const { toggleSidebar, togglePanel } = props

	const props_left: IPropsLeft = {
		toggleSidebar
	}

	const props_right: IPropsRight = {
		togglePanel
	}

	return (
		<div
			className={$cx(
				`
				relative
				flex
				items-center justify-center
				w-full h-[42px]
				text-under/60
				bg-over
			`,
				styles._local
			)}
		>
			<Left {...props_left}></Left>
			<Center></Center>
			<Right {...props_right}></Right>
		</div>
	)
}

export default $app.memo(Index)

import { Center, Left, Right } from './components'

import styles from './index.module.css'

const Index = () => {
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
			<Right></Right>
		</div>
	)
}

export default $app.memo(Index)

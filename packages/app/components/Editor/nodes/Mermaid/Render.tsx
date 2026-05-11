import { useEffect, useRef } from 'react'
import { WarningIcon } from '@phosphor-icons/react'
import { observer } from 'mobx-react-lite'
import { ErrorBoundary } from 'react-error-boundary'

import { useGlobal } from '@/context'
import { useSize } from '@/hooks'

import { mermaidRender } from '../../utils'

import styles from './index.module.css'

interface IProps {
	value: string
	onClick?: () => void
}

const Index = (props: IProps) => {
	const { value, onClick } = props
	const ref = useRef(null)
	const global = useGlobal()
	const theme = global.theme.theme_value
	const width = useSize(() => ref.current!, 'width') as number

	useEffect(() => {
		const el = ref.current

		if (!el || !value || !width) return

		mermaidRender(value, el, width)
	}, [value, width])

	useEffect(() => {
		const el = ref.current

		if (!el || !value || !width) return

		mermaidRender(value, el, width)
	}, [theme, width])

	return (
		<ErrorBoundary
			fallback={
				<div>
					<WarningIcon size={18}></WarningIcon>
				</div>
			}
		>
			<div
				className={$cx(
					'w_100 border_box justify_center',
					styles._local,
					onClick && styles.disable_select
				)}
				ref={ref}
				role='button'
				spellCheck={false}
				tabIndex={-1}
				onClick={onClick}
			/>
		</ErrorBoundary>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

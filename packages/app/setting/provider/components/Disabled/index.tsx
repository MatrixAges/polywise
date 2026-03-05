import { Switch } from '@/__shadcn__/components/ui/switch'
import { ProviderIcon } from '@/components'

import { useGlobalState } from '../../context'

import styles from '../../index.module.css'

import type { IPropsDisabled } from '../../types'

const Index = (props: IPropsDisabled) => {
	const { items, onEnableProvider } = props
	const { locales } = useGlobalState()

	return (
		<div className='flex flex-col gap-2.5'>
			<div className={styles.label}>{locales.form.disabled.disabled_provider}</div>
			{items.length > 0 ? (
				<div
					className='
						flex flex-col
						rounded-2xl
						text-solid
						bg-bg-main
						border border-border-gray
					'
				>
					{items.map(item => (
						<div
							className='
								flex
								items-center justify-between
								p-4
								border-b border-border-light
								last:border-none
							'
							key={item}
						>
							<div className='flex items-center gap-3 text-xl'>
								<ProviderIcon name={item} />
								<span className='text-sm'>
									{locales.providers[item as keyof typeof locales.providers]}
								</span>
							</div>
							<Switch checked={false} onCheckedChange={() => onEnableProvider(item)} />
						</div>
					))}
				</div>
			) : (
				<div
					className='
						flex
						justify-center
						px-4 py-5
						rounded-2xl
						text-xsm text-soft
						bg-bg-main
						border border-border-gray
					'
				>
					{locales.form.disabled.empty}
				</div>
			)}
		</div>
	)
}

export default $app.memo(Index)

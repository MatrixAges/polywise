import { House } from 'lucide-react'

import { is_mac_electron, memo } from '@/utils'

const Index = () => {
	return (
		<div
			className={$cx(
				`
				flex
				h-[41px]
				border-b border-std-900/8
				is_drag
			`,
				is_mac_electron && 'pl-[86px]'
			)}
		>
			<div
				className='
					flex
					items-center justify-center
					w-[42px] h-full
					bg-std-100
					border-std-900/8 border-l border-r
					shadow-[0_1px_0_0_var(--color-std-100)]
					no_drag clickable
				'
			>
				<House size={16}></House>
			</div>
		</div>
	)
}

export default memo(Index)

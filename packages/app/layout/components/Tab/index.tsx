import { House } from 'lucide-react'

import { is_mac_electron, memo } from '@/utils'

const Index = () => {
	return (
		<div className={$cx(`border-std-900/8 is_drag flex h-[36px] border-b`, is_mac_electron && 'pl-[86px]')}>
			<div className='bg-std-100 border-std-900/8 no_drag clickable flex h-full w-[37px] items-center justify-center border-r border-l shadow-[0_1px_0_0_var(--color-std-100)]'>
				<House size={16}></House>
			</div>
		</div>
	)
}

export default memo(Index)

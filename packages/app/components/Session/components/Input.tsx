import { PauseIcon, PlayIcon } from '@phosphor-icons/react'
import { Maximize } from 'lucide-react'

import { Textarea } from '@/__shadcn__/components/ui/textarea'
import { ModelSelect } from '@/components'

const Index = () => {
	return (
		<div className='relative w-full p-3'>
			<Textarea
				className='
					min-h-[100px] max-h-[300px]
					rounded-lg
					bg-card
					border-none
					focus-visible:ring-0
					shadow
				'
				placeholder='What would you like to know?'
				maxLength={9999}
			></Textarea>
			<div
				className='
					absolute
					bottom-4
					left-0
					flex
					items-center justify-between
					w-full
					px-5
				'
			>
				<div className='flex items-center gap-1'>
					<button className='icon_button'>
						<Maximize></Maximize>
					</button>
					<ModelSelect></ModelSelect>
				</div>
				<button className='icon_button primary h-6 w-6'>
					<PlayIcon className='fill-std-white h-[10px] w-[10px]' weight='fill'></PlayIcon>
				</button>
			</div>
		</div>
	)
}

export default $app.memo(Index)

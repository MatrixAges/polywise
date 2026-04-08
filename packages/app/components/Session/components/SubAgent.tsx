import { useEffect, useMemo } from 'react'
import { useToggle } from 'ahooks'
import { BotMessageSquare } from 'lucide-react'

import { useMounted } from '@/hooks'
import { getToolName } from '@/utils'

import Message from './Message'

import type { Message as MessageType } from '@core/fst'
import type { IPropsSubAgent } from '../types'

const Index = (props: IPropsSubAgent) => {
	const { streaming, part, answer } = props
	const [open, { toggle, set }] = useToggle(false)

	useEffect(() => set(streaming), [streaming])

	const name = useMemo(() => getToolName(part.type), [part.type])

	return (
		<div className='flex flex-col gap-3'>
			<div
				className='
					flex
					items-center
					gap-2
					text-muted-foreground
					hover:text-foreground
					cursor-pointer select-none
				'
				onClick={toggle}
			>
				<BotMessageSquare className='text-std-400 size-3'></BotMessageSquare>
				<span className='capitalize'>{name} Agent</span>
			</div>
			{open && (
				<div
					className='
						w-full
						p-3 pt-2.5
						rounded-xl
						border border-border-gray border-dashed
					'
				>
					<Message
						streaming={streaming}
						message={part.output as MessageType}
						answer={answer}
					></Message>
				</div>
			)}
		</div>
	)
}

export default $app.memo(Index)

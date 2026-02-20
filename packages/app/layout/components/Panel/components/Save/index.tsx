import { observer } from 'mobx-react-lite'
import { Button, Input, message } from 'antd'
import { useState } from 'react'

import { useGlobal } from '@/context'
import { memo } from '@/utils'

const { TextArea } = Input

const Index = observer(() => {
	const { memory } = useGlobal()
	const [content, setContent] = useState('')

	const handleSave = () => {
		if (!content.trim()) return

		try {
			memory.addTask('save', { content })
			setContent('')

			message.success('Task added to queue')
		} catch (error) {
			message.error(error instanceof Error ? error.message : 'Failed to create task')
		}
	}

	return (
		<div className='flex flex-1 flex-col gap-4 p-4'>
			<TextArea
				value={content}
				onChange={e => setContent(e.target.value)}
				placeholder='Paste text here to save to memory...'
				autoSize={{ minRows: 10, maxRows: 20 }}
				className='resize-none'
			/>
			<Button type='primary' onClick={handleSave} disabled={!content.trim()}>
				Save to Memory
			</Button>
		</div>
	)
})

export default memo(Index)

import { useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { useTranslation } from 'react-i18next'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'

import type { IPropsModal } from '../../types'

const emojis = ['😀', '😂', '😍', '🤔', '😭', '🎉', '🔥', '✅', '🚀', '💡', '📝', '📌']

const Index = (props: IPropsModal) => {
	const { editor } = props
	const { t } = useTranslation()
	const [value, setValue] = useState('')

	const onSelect = useMemoizedFn((v: string) => {
		const { from, to } = editor.state.selection
		const text_before = editor.state.doc.textBetween(from - 1, to)

		if (text_before !== '/') return

		editor.chain()
			.focus()
			.deleteRange({ from: from - 1, to })
			.insertContent(v)
			.run()

		editor.commands.closeModal()
	})

	return (
		<div className='flex flex-col gap-3'>
			<div className='grid grid-cols-6 gap-2'>
				{emojis.map(item => (
					<button
						className={`
							p-2
							rounded-xl
							text-xl
							bg-secondary/60
							hover:bg-secondary
							transition
						`}
						key={item}
						type='button'
						onClick={() => onSelect(item)}
					>
						{item}
					</button>
				))}
			</div>
			<div className='flex gap-2'>
				<Input
					placeholder={t('emoji_panel.placeholder')}
					value={value}
					onChange={e => setValue(e.target.value)}
				></Input>
				<Button type='button' onClick={() => value && onSelect(value)}>
					{t('emoji_panel.insert')}
				</Button>
			</div>
		</div>
	)
}

export default $app.memo(Index)

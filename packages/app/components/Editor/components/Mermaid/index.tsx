import { useLayoutEffect, useState } from 'react'
import { TreeStructureIcon } from '@phosphor-icons/react'
import { useMemoizedFn } from 'ahooks'
import { useTranslation } from 'react-i18next'

import { Button } from '@/__shadcn__/components/ui/button'
import { Textarea } from '@/__shadcn__/components/ui/textarea'

import Render from '../../nodes/Mermaid/Render'

import styles from './index.module.css'

import type { FormEvent } from 'react'
import type { IPropsModalMermaid } from '../../types'

const Index = (props: IPropsModalMermaid) => {
	const { editor, context } = props
	const { t } = useTranslation()
	const [value, setValue] = useState('')

	useLayoutEffect(() => {
		if (!context) return

		setValue(context.value)
	}, [context])

	const onFinish = useMemoizedFn((e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (!value) return

		if (context) {
			editor.chain().setNodeSelection(context.pos).updateMermaid({ value }).focus().run()
		} else {
			const { from, to } = editor.state.selection
			const text_before = editor.state.doc.textBetween(from - 1, to)

			if (text_before !== '/') return

			const node = editor.schema.nodes.mermaid.create({ value })
			const transaction = editor.state.tr

			transaction.replaceRangeWith(from - 1, to, node)

			editor.view.dispatch(transaction)

			editor.chain().focus().run()
		}

		editor.commands.closeModal()
	})

	return (
		<div className={$cx('relative w-full', styles._local)}>
			<form className='flex flex-col gap-3' onSubmit={onFinish}>
				<div className='flex flex-col gap-2'>
					<span className='text-sm'>{t('editor.Mermaid.modal.label.definition')}</span>
					<Textarea
						placeholder={t('editor.Mermaid.modal.placeholder')}
						value={value}
						onChange={e => setValue(e.target.value)}
					></Textarea>
				</div>
				<div className='flex flex-col gap-2'>
					<span className='text-sm'>{t('preview')}</span>
					<div
						className={`
							box-border
							flex
							items-center justify-center
							w-full
							transition-all
							prewview_wrap
						`}
					>
						<Choose>
							<When condition={value}>
								<Render value={value}></Render>
							</When>
							<Otherwise>
								<span className='preview'>
									<TreeStructureIcon></TreeStructureIcon>
								</span>
							</Otherwise>
						</Choose>
					</div>
				</div>
				<Button className='mt-4 w-full' type='submit'>
					{t('confirm')}
				</Button>
			</form>
		</div>
	)
}

export default $app.memo(Index)

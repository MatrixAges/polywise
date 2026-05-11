import { useLayoutEffect, useState } from 'react'
import { FunctionIcon } from '@phosphor-icons/react'
import { useMemoizedFn } from 'ahooks'
import { useTranslation } from 'react-i18next'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'
import { Switch } from '@/__shadcn__/components/ui/switch'
import { Textarea } from '@/__shadcn__/components/ui/textarea'

import Render from './Render'

import styles from './index.module.css'

import type { FormEvent } from 'react'
import type { IPropsModalKatex } from '../../types'

const Index = (props: IPropsModalKatex) => {
	const { editor, context } = props
	const { t } = useTranslation()
	const [value, setValue] = useState('')
	const [inline, setInline] = useState(false)

	useLayoutEffect(() => {
		if (!context) return

		setValue(context.value)
		setInline(!!context.inline)
	}, [context])

	const onFinish = useMemoizedFn((e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (!value) return

		if (context) {
			if (context.inline) {
				editor.chain().setNodeSelection(context.pos).updateInlineMath({ latex: value }).focus().run()
			} else {
				editor.chain().setNodeSelection(context.pos).updateBlockMath({ latex: value }).focus().run()
			}
		} else {
			const { from, to } = editor.state.selection
			const text_before = editor.state.doc.textBetween(from - 1, to)

			if (text_before !== '/') return

			if (inline) {
				editor.chain()
					.insertInlineMath({ latex: value })
					.deleteRange({ from: from - 1, to })
					.focus()
					.run()
			} else {
				const node = editor.schema.nodes.blockMath.create({ latex: value })
				const transaction = editor.state.tr

				transaction.replaceRangeWith(from - 1, to, node)

				editor.view.dispatch(transaction)

				editor.chain().focus().run()
			}
		}

		editor.commands.closeModal()
	})

	return (
		<div className={$cx('w_100 relative', styles._local)}>
			<form className='flex flex-col gap-3' onSubmit={onFinish}>
				<If condition={!context}>
					<label className='flex items-center gap-2 text-sm'>
						<Switch checked={inline} size='sm' onCheckedChange={setInline}></Switch>
						<span>{t('editor.Katex.modal.label.inline')}</span>
					</label>
				</If>
				<div className='flex flex-col gap-2'>
					<span className='text-sm'>{t('editor.Katex.modal.label.equation')}</span>
					<Choose>
						<When condition={inline}>
							<Input
								placeholder={t('editor.Katex.modal.placeholder.equation')}
								value={value}
								onChange={e => setValue(e.target.value)}
							></Input>
						</When>
						<Otherwise>
							<Textarea
								placeholder={t('editor.Katex.modal.placeholder.equation')}
								value={value}
								onChange={e => setValue(e.target.value)}
							></Textarea>
						</Otherwise>
					</Choose>
				</div>
				<div className='flex flex-col gap-2'>
					<span className='text-sm'>{t('preview')}</span>
					<div
						className={`
							flex
							border_box
							prewview_wrap w_100 justify_center align_center transition_normal
						`}
					>
						<Choose>
							<When condition={value}>
								<Render value={value} inline={inline}></Render>
							</When>
							<Otherwise>
								<span className='preview'>
									<FunctionIcon></FunctionIcon>
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

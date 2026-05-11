import { useRef, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'
import { uploadFile } from '@/utils/file'

import { getFileAlt } from '../../utils'
import Model from './model'
import options from './options'

import styles from './index.module.css'

import type { ChangeEvent, FormEvent } from 'react'
import type { IPropsModal } from '../../types'

const Index = (props: IPropsModal) => {
	const { editor } = props
	const [x] = useState(() => new Model())
	const { t } = useTranslation()
	const ref_file = useRef<HTMLInputElement>(null)
	const [src, setSrc] = useState('')
	const [alt, setAlt] = useState('')

	const onChangeType = useMemoizedFn(v => {
		x.type = v
		setSrc('')
		setAlt('')
	})

	const onLocalFileUploaderChange = useMemoizedFn(async () => {
		const file = await uploadFile({ max_count: 1, accept: 'image/*' })

		if (!file || Array.isArray(file)) return

		const local_file = window.$shell?.getPathForFile(file)

		if (!local_file) return

		setSrc(local_file.path)
		setAlt(local_file.name)
	})

	const onUploadFile = useMemoizedFn(async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]

		if (!file) return

		const local_file = window.$shell?.getPathForFile(file)

		if (!local_file) return

		setSrc(local_file.path)
		setAlt(getFileAlt(local_file.name))
		e.target.value = ''
	})

	const onFinish = useMemoizedFn((e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		if (!src) return

		const target = { alt, src: src.startsWith('http') ? src : `xfile://${src}` }

		const { from, to } = editor.state.selection
		const text_before = editor.state.doc.textBetween(from - 1, to)

		if (text_before !== '/') return

		editor.chain()
			.focus()
			.deleteRange({ from: from - 1, to })
			.setImage(target)
			.run()

		editor.commands.closeModal()
	})

	return (
		<div className={$cx('w_100 flex_column flex', styles._local)}>
			<div className='mb-4 grid grid-cols-2 gap-2'>
				{options.map(item => (
					<button
						className={$cx(
							`
							flex
							items-center justify-center
							gap-2
							px-3 py-2
							rounded-2xl
							text-sm
							border
							transition
						`,
							x.type === item.value
								? 'bg-primary text-primary-foreground'
								: 'bg-secondary/40'
						)}
						key={item.value}
						type='button'
						onClick={() => onChangeType(item.value)}
					>
						{item.icon}
						{item.label}
					</button>
				))}
			</div>
			<form className='relative flex flex-col gap-3' onSubmit={onFinish}>
				<Choose>
					<When condition={x.type === 'URL'}>
						<Button type='button' variant='outline' onClick={onLocalFileUploaderChange}>
							Choose Local Image
						</Button>
						<div className='flex flex-col gap-2'>
							<span className='text-sm'>{t('editor.Image.label.url')}</span>
							<Input
								placeholder={t('editor.Image.placeholder.url')}
								value={src}
								onChange={e => setSrc(e.target.value)}
							></Input>
						</div>
					</When>
					<When condition={x.type === 'File'}>
						<input
							accept='image/*'
							className='hidden'
							ref={ref_file}
							type='file'
							onChange={onUploadFile}
						/>
						<Button type='button' variant='outline' onClick={() => ref_file.current?.click()}>
							{t('editor.Image.label.file')}
						</Button>
						<If condition={!!src}>
							<div className='flex flex-col gap-2'>
								<span className='text-sm'>{t('editor.Image.label.url')}</span>
								<Input value={src} readOnly></Input>
							</div>
						</If>
					</When>
				</Choose>
				<div className='flex flex-col gap-2'>
					<span className='text-sm'>{t('editor.Image.label.alt')}</span>
					<Input
						placeholder={t('editor.Image.placeholder.alt')}
						value={alt}
						onChange={e => setAlt(e.target.value)}
					></Input>
				</div>
				<Button className='mt-4 w-full' type='submit'>
					{t('confirm')}
				</Button>
			</form>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

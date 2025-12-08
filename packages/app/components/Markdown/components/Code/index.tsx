import { useEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'

import { highlight } from '@/utils'
import { CheckIcon, CopyIcon } from '@phosphor-icons/react'

import styles from './index.module.css'

import type { BundledLanguage } from 'shiki/bundle/web'

interface IProps {
	children: string
	language: BundledLanguage
}

const Index = (props: IProps) => {
	const { children, language } = props
	const [html, setHTML] = useState<string>('')
	const [copyied, setCopyied] = useState(false)

	useEffect(() => {
		highlight({ code: children, lang: language, theme: 'light' }).then(setHTML)
	}, [children, language])

	const copy = useMemoizedFn(() => {
		setCopyied(true)

		navigator.clipboard.writeText(children)

		setTimeout(() => {
			setCopyied(false)
		}, 2400)
	})

	return (
		<div className={`w_100 border_box relative ${styles._local}`}>
			<span className='absolute lang'>{language}</span>
			<button
				className='
					flex
					absolute
					btn_copy justify_center align_center clickable
				'
				onClick={copy}
			>
				{copyied ? <CheckIcon></CheckIcon> : <CopyIcon></CopyIcon>}
			</button>
			<div className='flex pre_wrap w_100' dangerouslySetInnerHTML={{ __html: html }}></div>
		</div>
	)
}

export default new $app.handle(Index).by(observer).by($app.memo).get()

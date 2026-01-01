import { useEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { Check, Copy } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { highlight } from '@/utils'

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
		<div className={`w_100 border_box relative${styles._local}`}>
			<span className='lang absolute'>{language}</span>
			<button
				className='
					absolute
					flex
					btn_copy justify_center align_center clickable
				'
				onClick={copy}
			>
				{copyied ? <Check></Check> : <Copy></Copy>}
			</button>
			<div className='pre_wrap w_100 flex' dangerouslySetInnerHTML={{ __html: html }}></div>
		</div>
	)
}

export default new $app.handle(Index).by(observer).by($app.memo).get()

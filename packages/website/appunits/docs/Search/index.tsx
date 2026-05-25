import { Fragment, useEffect, useRef, useState } from 'react'
import { ArrowBendDownLeft, ArrowDown, ArrowUp, MagnifyingGlass, Trash, X } from '@phosphor-icons/react'
import Loading from '@website/components/Loading'
import LoadingCircle from '@website/components/LoadingCircle'
import SimpleEmpty from '@website/components/SimpleEmpty'
import {
	useAsyncEffect,
	useEventListener,
	useFocusWithin,
	useLocalStorageState,
	useMemoizedFn,
	useUpdateEffect
} from '@website/hooks/ahooks'
import useLocale from '@website/hooks/useLocale'
import useRouterHash from '@website/hooks/useRouterHash'
import { usePathname, useRouter } from '@website/i18n/navigation'
import { $ } from '@website/utils'
import { requestWeb } from '@website/utils/ofetch'
import db from 'localforage'
import { debounce, groupBy } from 'lodash-es'
import { decompressFromUTF16 } from 'lz-string'
import { useTranslations } from 'next-intl'

import Group from './Group'

import styles from './index.module.css'

import type { Document as FlexDocument } from 'flexsearch'
import type { KeyboardEvent, MouseEvent } from 'react'

export interface IndexItem {
	id: string
	link: string
	type: 'heading' | 'content'
	headings: string
	content: string
}

export type Items = Record<string, Array<IndexItem>>

interface IProps {
	closeSearch: () => void
}

const Index = (props: IProps) => {
	const { closeSearch } = props
	const t = useTranslations('docs')
	const pathname = usePathname()
	const { locale } = useLocale()
	const ref = useRef<HTMLInputElement>(null)
	const focusing = useFocusWithin(ref)
	const [loading_index, setLoadingIndex] = useState(false)
	const [loading_items, setLoadingItems] = useState(false)
	const [compositing, setCompositing] = useState(false)
	const [text, setText] = useState('')
	const [current, setCurrent] = useState<{ link: string; index: number | null }>({ link: '', index: null })
	const [items, setItems] = useState<Items>({})
	const [_history, setHistory] = useLocalStorageState<Array<string>>('search_history', {
		defaultValue: []
	})
	const hash = useRouterHash()
	const router = useRouter()
	const history = _history!

	useUpdateEffect(() => {
		closeSearch()
	}, [pathname, hash])

	const setSearchIndex = useMemoizedFn((search_index: FlexDocument<IndexItem, true>, v: string) => {
		const local_index = JSON.parse(decompressFromUTF16(v))

		Object.keys(local_index).forEach(key => {
			search_index.import(key, local_index[key])
		})

		window.__search_index__ = search_index
	})

	useAsyncEffect(async () => {
		if (!locale || window.__search_index__) return

		setLoadingIndex(true)

		const [Document, timestamp, local_timestamp] = await Promise.all([
			import('flexsearch').then(res => res.default.Document),
			requestWeb(`/search/timestamp`, { parseResponse: txt => txt }),
			db.getItem(`search_index_timestamp_${locale}`)
		])

		const search_index = new Document<IndexItem, true>({
			cache: 100,
			tokenize: 'full',
			document: {
				id: 'id',
				index: 'content',
				store: true
			},
			context: {
				resolution: 9,
				depth: 3,
				bidirectional: true
			}
		})

		if (local_timestamp === timestamp) {
			const local_index_string = await db.getItem(`search_index_${locale}`)

			if (local_index_string) {
				setSearchIndex(search_index, local_index_string as string)

				return setLoadingIndex(false)
			}
		}

		const index_string = await requestWeb(`/search/${locale}`, { parseResponse: txt => txt })

		setSearchIndex(search_index, index_string)
		setLoadingIndex(false)

		await db.setItem(`search_index_timestamp_${locale}`, timestamp)
		await db.setItem(`search_index_${locale}`, index_string)
	}, [locale])

	const searchByInput = useMemoizedFn(async v => {
		setLoadingItems(true)

		const index = window.__search_index__
		const res = await index.searchAsync(v, { enrich: true })

		setLoadingItems(false)

		const result = res?.[0]?.result

		if (!result || !result.length) {
			return setItems({})
		}

		const items = result.map(item => item.doc)

		setItems(groupBy(items, 'link') as unknown as Items)
		addHistory(v)
	})

	useEventListener('compositionstart', () => setCompositing(true), { target: ref })

	useEventListener(
		'compositionend',
		() => {
			setCompositing(false)
			searchByInput(ref.current?.value!)
			setText(ref.current?.value!)
		},
		{ target: ref }
	)

	const handleChangeIndex = useMemoizedFn(e => {
		const event = e as KeyboardEvent

		if (event.key === 'Enter') {
			event.preventDefault()

			const target = items[current.link]

			if (!target) return

			if (current.index === null) {
				return router.push(`/docs/${current.link}`)
			}

			const item = target[current.index]

			return router.push(`/docs/${current.link}#${item.headings.split('>').at(-1)}`)
		}

		if (event.key === 'Escape') {
			event.preventDefault()
			closeSearch()

			return
		}

		const keys = Object.keys(items)

		if (!keys.length) return

		if (current.link === '' && current.index === null) {
			setCurrent({
				link: Object.keys(items)[0],
				index: null
			})
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault()

			if (current.index === null) {
				const group_index = keys.findIndex(i => i === current.link)

				if (group_index === 0) return

				const prev_group_key = keys[group_index - 1]

				return setCurrent({
					link: prev_group_key,
					index: items[prev_group_key].length - 1
				})
			} else {
				if (current.index === 0) {
					return setCurrent({
						link: current.link,
						index: null
					})
				}

				return setCurrent({
					link: current.link,
					index: current.index - 1
				})
			}
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault()

			if (current.index === null) {
				return setCurrent({
					link: current.link,
					index: 0
				})
			} else {
				if (current.index === items[current.link].length - 1) {
					const group_index = keys.findIndex(i => i === current.link)

					if (group_index === keys.length - 1) return

					const next_group_key = keys[group_index + 1]

					return setCurrent({
						link: next_group_key,
						index: null
					})
				}

				return setCurrent({
					link: current.link,
					index: current.index + 1
				})
			}
		}
	})

	useEffect(() => {
		if (!open) return

		document.addEventListener('keydown', handleChangeIndex)

		return () => document.removeEventListener('keydown', handleChangeIndex)
	}, [open])

	const onInput = useMemoizedFn(
		debounce(({ target: { value } }) => {
			if (compositing) return

			searchByInput(value)
			setText(value)
		}, 600)
	)

	const clear = useMemoizedFn(() => {
		ref.current!.value = ''

		searchByInput('')
		setText('')
	})

	const onSearchItem = useMemoizedFn((e: MouseEvent<HTMLDivElement>) => {
		const target = e.target as HTMLDivElement
		const text = target.getAttribute('data-text')

		if (!text) return

		ref.current!.value = text

		searchByInput(text)
		setText(text)
	})

	const addHistory = useMemoizedFn((text: string) => {
		if (history.includes(text)) return

		history.unshift(text)

		if (history.length > 15) {
			history!.pop()
		}

		setHistory(history)
	})

	const clearHistory = useMemoizedFn(() => setHistory([]))

	return (
		<div className={$.cx('relative flex flex-col', styles._local)}>
			{loading_index && (
				<div
					className='
						absolute
						flex flex-col
						items-center justify-center
						w-full h-full
						loading_wrap
					'
				>
					<Loading size={66}></Loading>
					<span>{t('search.loading_index')}</span>
				</div>
			)}
			<div className='flex flex-col'>
				<div
					className='
						relative
						flex
						items-center
						w-full
						input_wrap
					'
				>
					<MagnifyingGlass
						className={$.cx(
							`
							absolute
							transition-all duration-300 ease-in-out
							icon_search
						`,
							focusing && 'focusing'
						)}
						size={18}
					></MagnifyingGlass>
					<input
						type='text'
						className='input_search box-border w-full'
						placeholder={t('search.placeholder')}
						autoFocus
						maxLength={30}
						ref={ref}
						onInput={onInput}
					/>
					{text && (
						<div
							className='
								absolute
								flex
								items-center justify-center
								btn_clear clickable
							'
							onClick={clear}
						>
							<X size={15}></X>
						</div>
					)}
				</div>
				<div
					className='
						relative
						box-border
						flex flex-col
						w-full
						search_items_wrap
					'
				>
					{loading_items && (
						<div
							className='
								absolute
								left-0
								flex flex-col
								items-center justify-center
								w-full h-full
								loading_wrap
							'
						>
							<LoadingCircle size={48}></LoadingCircle>
							<span className='mt-1'>{t('search.loading_items')}</span>
						</div>
					)}
					{Object.keys(items).length > 0 ? (
						<div className='search_items flex flex-col'>
							{Object.keys(items).map(link => (
								<Group
									link={link}
									items={items[link]}
									current={current}
									setCurrent={setCurrent}
									key={link}
								></Group>
							))}
						</div>
					) : (
						<Fragment>
							{history!.length > 0 && (
								<div
									className='
										box-border
										flex flex-col
										w-full
										search_history
									'
								>
									<div className='search_history_header flex items-center justify-between'>
										<span className='title'>{t('search.history')}</span>
										<div
											className='
												flex
												items-center justify-center
												btn_clear clickable
											'
											onClick={clearHistory}
										>
											<Trash size={14}></Trash>
										</div>
									</div>
									<div className='flex flex-wrap' onClick={onSearchItem}>
										{history.map((item, index) => (
											<span
												className='
													box-border
													mr-1
													search_history_item cursor-pointer clickable
												'
												data-text={item}
												key={index}
											>
												{item}
											</span>
										))}
									</div>
								</div>
							)}
							<SimpleEmpty style={{ height: 480 }}></SimpleEmpty>
						</Fragment>
					)}
				</div>
				<div
					className='
						box-border
						flex
						items-center justify-between
						w-full
						hotkey_wrap
					'
				>
					<div className='flex items-center'>
						<div className='key_item mr-4.5 flex items-center'>
							<div
								className='
									box-border
									flex
									items-center justify-center
									icon_key_wrap
								'
							>
								<ArrowUp></ArrowUp>
							</div>
							<div
								className='
									box-border
									flex
									items-center justify-center
									icon_key_wrap
								'
							>
								<ArrowDown></ArrowDown>
							</div>
							<span className='desc'>{t('search.to_navigate')}</span>
						</div>
						<div className='key_item flex items-center'>
							<div
								className='
									box-border
									flex
									items-center justify-center
									icon_key_wrap
								'
							>
								<ArrowBendDownLeft></ArrowBendDownLeft>
							</div>
							<span className='desc'>{t('search.to_select')}</span>
						</div>
					</div>
					<div className='flex items-center'>
						<div className='key_item flex items-center'>
							<div
								className='
									box-border
									flex
									items-center justify-center
									icon_key_wrap esc_wrap
								'
							>
								<span className='esc'>esc</span>
							</div>
							<span className='desc'>{t('search.to_close')}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default $.memo(Index)

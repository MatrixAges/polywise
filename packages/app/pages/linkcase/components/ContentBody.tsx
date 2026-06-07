import { Globe, Loader } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { MessageResponse } from '@/__shadcn__/components/ai-elements/message'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('linkcase')
	const has_content = Boolean(x.detail?.article?.content?.trim())

	return (
		<div
			className='
				overflow-y-auto
				flex-1
				min-h-0
				px-6 py-5
			'
		>
			{x.detail_loading ? (
				<div
					className='
						flex
						items-center justify-center
						h-full
						gap-2
						text-sm text-std-300
					'
				>
					<Loader className='size-4 animate-spin'></Loader>
					<span>{t('content.loading')}</span>
				</div>
			) : has_content ? (
				<div className='page_wrap' data-streamdown>
					<MessageResponse className='w-full leading-7'>
						{x.detail?.article?.content || ''}
					</MessageResponse>
				</div>
			) : (
				<div
					className='
							flex flex-col
							items-center justify-center
							h-full
							gap-3
							text-sm text-std-300
						'
				>
					<Globe className='size-5'></Globe>
					<span>{x.selected_item ? t('content.empty_markdown') : t('content.select_hint')}</span>
				</div>
			)}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

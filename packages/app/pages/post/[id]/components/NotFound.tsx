import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Button } from '@/__shadcn__/components/ui/button'

const Index = () => {
	const { t } = useTranslation('post')
	const navigate = useNavigate()

	return (
		<div
			className='
				flex flex-col
				items-center justify-center
				h-full
				gap-4
				text-center
			'
		>
			<div className='text-std-400 text-sm'>{t('detail.not_found')}</div>
			<Button variant='outline' onClick={() => navigate('/post')}>
				<ArrowLeft className='size-4'></ArrowLeft>
				<span>{t('detail.back_to_posts')}</span>
			</Button>
		</div>
	)
}

export default Index

'use client'

import { CalendarDots } from '@phosphor-icons/react'
import { group_journals } from '@website/appdata/journals'
import MDListPage from '@website/components/MDListPage'
import { useTranslations } from 'next-intl'

const Index = () => {
	const t = useTranslations('index')

	return (
		<MDListPage
			type='journal'
			title={t('Latest.journal.title')}
			desc={t('Latest.journal.desc')}
			Icon={<img src='/images/svg/view-timeline.svg' alt='view-timeline' />}
			group={group_journals}
			timeline
		></MDListPage>
	)
}

export default Index

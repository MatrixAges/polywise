import { useMemoizedFn } from '@website/hooks/ahooks'
import { message as ms } from 'antd'
import { useTranslations } from 'next-intl'

const { useMessage } = ms

export default () => {
	const t = useTranslations('global')
	const [message, context] = useMessage()

	const copy = useMemoizedFn(async () => {
		await window.navigator.clipboard.writeText('community@polywise.io')

		message.success(t('copy', { name: 'community@polywise.io' }))
	})

	return { context, copy }
}

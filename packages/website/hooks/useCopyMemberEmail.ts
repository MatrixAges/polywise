import { useMemoizedFn } from '@website/hooks/ahooks'
import useToast from '@website/hooks/useToast'
import { useTranslations } from 'next-intl'

export default () => {
	const t = useTranslations('global')
	const toast = useToast()

	const copy = useMemoizedFn(async () => {
		await window.navigator.clipboard.writeText('community@polywise.io')

		toast.success(t('copy', { name: 'community@polywise.io' }))
	})

	return { context: null, copy }
}

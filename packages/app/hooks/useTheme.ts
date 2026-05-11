import { useGlobal } from '@/context'

export default () => {
	const global = useGlobal()

	return global.theme.theme_value
}

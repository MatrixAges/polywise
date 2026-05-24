import useMediaQuery from './useMediaQuery'

export default () => {
	const is_mobile = useMediaQuery('(max-width: 720px)')

	return is_mobile
}

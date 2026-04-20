import ensureArray from '../../../utils/ensureArray'

export default (value: unknown) => {
	return ensureArray<string>(value).filter(item => typeof item === 'string')
}

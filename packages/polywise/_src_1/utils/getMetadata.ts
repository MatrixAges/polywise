import { Metadata } from '../types'

export default <T extends { metadata?: Metadata }>(args: T) => {
	const { metadata } = args

	return {
		metadata: JSON.stringify(metadata ?? {})
	} as unknown as T
}

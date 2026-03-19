import { p } from '@desktop/utils'
import { nativeTheme } from 'electron'
import { enum as Enum, object } from 'zod'

const input_type = object({
	theme: Enum(['light', 'dark', 'system'])
})

export default p.input(input_type).mutation(async ({ input }) => {
	const { theme } = input

	nativeTheme.themeSource = theme
})

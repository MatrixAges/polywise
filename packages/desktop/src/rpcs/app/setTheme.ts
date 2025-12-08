import { nativeTheme } from 'electron'
import { enum as Enum, object } from 'zod'

import { p } from '@desktop/utils'

const input_type = object({
	theme: Enum(['light', 'dark', 'system'])
})

export default p.input(input_type).mutation(async ({ input }) => {
	const { theme } = input

	nativeTheme.themeSource = theme
})

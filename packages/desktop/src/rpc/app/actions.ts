import { p } from '@desktop/utils'
import { enum as Enum, object } from 'zod'

const input_type = object({
	type: Enum(['minimize', 'maximize', 'close'])
})

export default p.input(input_type).query(async ({ input, ctx }) => {
	const { type } = input

	switch (type) {
		case 'minimize':
			ctx.win.minimize()
			break
		case 'maximize':
			if (ctx.win.isMaximized()) {
				ctx.win.unmaximize()
			} else {
				ctx.win.maximize()
			}
			break
		case 'close':
			ctx.win.close()
			break
	}
})

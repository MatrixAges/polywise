import { Bash, ReadWriteFs } from 'just-bash'

import { getBashTools } from '../utils'

import type Index from '../session'

export const createBashTool = async (s: Index) => {
	const bash = new Bash({
		cwd: '/',
		fs: new ReadWriteFs({ root: s.cwd }),
		network: { dangerouslyAllowFullInternetAccess: true }
	})

	const tools = await getBashTools(s, bash)

	return { bash: tools.bash, readFile: tools.readFile, writeFile: tools.writeFile, env: bash }
}

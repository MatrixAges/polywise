import { createBashTool as BashTool } from 'bash-tool'
import { Bash, ReadWriteFs } from 'just-bash'

import getBashTools from '../utils/getBashTools'

import type Index from '../session'

export const createBashTool = async (s: Index) => {
	const bash = new Bash({ cwd: '/', fs: new ReadWriteFs({ root: s.cwd }) })

	const { tools } = await BashTool({
		destination: '/',
		sandbox: getBashTools(s, bash)
	})

	return { bash: tools.bash, readFile: tools.readFile, writeFile: tools.writeFile, env: bash }
}

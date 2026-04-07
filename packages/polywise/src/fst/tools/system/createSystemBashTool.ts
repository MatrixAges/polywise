import { createBashTool as BashTool } from 'bash-tool'
import { Bash } from 'just-bash'

import getBashTools from '../../utils/getBashTools'
import bfs from './bfs'

import type Index from '../../session'

export default async (s: Index) => {
	const sandboxEnv = { ...process.env } as Record<string, string>

	sandboxEnv.PATH = `/bin:/usr/bin:${sandboxEnv.PATH || ''}`

	const bash = new Bash({
		cwd: '/',
		fs: bfs,
		env: sandboxEnv
	})

	const { tools } = await BashTool({
		destination: '/',
		sandbox: getBashTools(s, bash, true)
	})

	return { bash: tools.bash, readFile: tools.readFile, writeFile: tools.writeFile, env: bash }
}

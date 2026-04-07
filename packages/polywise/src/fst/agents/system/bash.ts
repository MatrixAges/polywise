import { Bash } from 'just-bash'

import { getBashTools } from '../../utils'
import fs from './fs'

import type Session from '../../session'

export default async (s: Session) => {
	const sandboxEnv = { ...process.env } as Record<string, string>

	sandboxEnv.PATH = `/bin:/usr/bin:${sandboxEnv.PATH || ''}`

	console.log('------------')
	console.log(sandboxEnv)

	const bash = new Bash({ cwd: '/', fs, env: sandboxEnv })

	const tools = await getBashTools(s, bash, true)

	return { bash: tools.bash, readFile: tools.readFile, writeFile: tools.writeFile, env: bash }
}

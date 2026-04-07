import { Bash } from 'just-bash'

import { getBashTools } from '../../utils'
import fs from './fs'

import type Session from '../../session'

export default async (s: Session) => {
	const bash = new Bash({ cwd: '/', fs })

	const tools = await getBashTools(s, bash, true)

	return { bash: tools.bash, readFile: tools.readFile, writeFile: tools.writeFile, env: bash }
}

import { Bash, MountableFs, ReadWriteFs } from 'just-bash'

import { getBashTools } from '../utils'

import type Session from '../session'

export const createBashTool = async (s: Session) => {
	const fs = new MountableFs({
		base: new ReadWriteFs({ root: s.cwd }),
		mounts: [{ mountPoint: '/skills', filesystem: new ReadWriteFs({ root: s.skills_dir }) }]
	})

	const bash = new Bash({
		cwd: '/',
		fs,
		network: { dangerouslyAllowFullInternetAccess: true }
	})

	const tools = await getBashTools(s, bash)

	return { bash: tools.bash, readFile: tools.readFile, writeFile: tools.writeFile, env: bash }
}

import { app } from '@core/consts'
import { Bash, MountableFs, ReadWriteFs } from 'just-bash'

import { getBashTools } from '../utils'

import type Index from '../session'

export const createBashTool = async (s: Index) => {
	const fs = new MountableFs({
		base: new ReadWriteFs({ root: s.cwd }),
		mounts: [{ mountPoint: app.app_path, filesystem: new ReadWriteFs({ root: app.app_path }) }]
	})

	const bash = new Bash({
		cwd: '/',
		fs,
		network: { dangerouslyAllowFullInternetAccess: true }
	})

	const tools = await getBashTools(s, bash)

	return { bash: tools.bash, readFile: tools.readFile, writeFile: tools.writeFile, env: bash }
}

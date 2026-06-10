import os from 'os'
import path from 'path'

import { readJsonFile } from '../runtime'

import type { OpenCodeAuthFile } from './types'

export default async () => {
	const auth_path = path.resolve(os.homedir(), '.local/share/opencode/auth.json')

	return await readJsonFile<OpenCodeAuthFile>(auth_path)
}

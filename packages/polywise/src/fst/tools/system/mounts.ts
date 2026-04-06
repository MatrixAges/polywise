import fs from 'fs'
import { InMemoryFs, MountableFs, ReadWriteFs } from 'just-bash'

import { SYSTEM_MOUNT_PATHS } from './consts'

export const getRootMounts = () => {
	const platform = process.platform
	const paths = SYSTEM_MOUNT_PATHS[platform] || SYSTEM_MOUNT_PATHS.linux
	const mounts: { mountPoint: string; filesystem: any }[] = []

	for (const path of paths) {
		try {
			const stat = fs.statSync(path)

			if (!stat.isDirectory()) continue

			mounts.push({
				mountPoint: path,
				filesystem: new ReadWriteFs({
					root: path,
					allowSymlinks: true
				})
			})
		} catch (err) {
			if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
				console.error(`Failed to mount ${path}:`, err)
			}
		}
	}

	return mounts
}

export const bfs = new MountableFs({
	base: new InMemoryFs(),
	mounts: getRootMounts()
})

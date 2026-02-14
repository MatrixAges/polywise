import path from 'path'
import { Arch } from 'electron-builder'
import fs from 'fs-extra'
import { sync } from 'glob'

import type { Configuration } from 'electron-builder'

export const afterPack: Configuration['afterPack'] = async context => {
	const arch_map = {
		[Arch.ia32]: 'ia32',
		[Arch.x64]: 'x64',
		[Arch.armv7l]: 'armv7l',
		[Arch.arm64]: 'arm64',
		[Arch.universal]: 'universal'
	}

	const arch = arch_map[context.arch]
	const os = context.electronPlatformName

	console.log('-----------')
	console.log(`[Cleanup] Target OS: ${os} | Arch: ${arch}`)
	console.log('-----------')

	const pattern = `${context.appOutDir}/**/node_modules/onnxruntime-node/bin/napi-v3`
	const bin_path = sync(pattern)[0]

	if (!fs.existsSync(bin_path)) return

	const os_folders = fs.readdirSync(bin_path)

	os_folders.forEach(os_folder => {
		const os_path = path.join(bin_path, os_folder)

		if (os_folder !== os) {
			fs.removeSync(os_path)

			console.log(`Removed OS: ${os_folder}`)
		} else {
			const arch_folders = fs.readdirSync(os_path)

			arch_folders.forEach(arch_folder => {
				if (arch_folder !== arch) {
					fs.removeSync(path.join(os_path, arch_folder))

					console.log(`Removed Arch: ${os_folder}/${arch_folder}`)
				}
			})
		}
	})
}

import fs from 'fs-extra'

export default async (path: string, v: any) => {
	const exists = await fs.pathExists(path)

	if (!exists) {
		await fs.outputFile(path, JSON.stringify(v, null, 4))
	}
}

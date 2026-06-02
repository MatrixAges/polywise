import { cp, mkdir, rm } from 'node:fs/promises'
import { basename } from 'node:path'
import { globSync } from 'glob'

const readAssetPatterns = () => {
	const asset_glob = process.env.ASSET_GLOB?.trim() || ''

	if (!asset_glob) {
		throw new Error('ASSET_GLOB is required')
	}

	return asset_glob
		.split('\n')
		.map(asset_pattern => asset_pattern.trim())
		.filter(Boolean)
}

const readUploadDir = () => {
	const upload_dir = process.env.UPLOAD_DIR?.trim() || ''

	if (!upload_dir) {
		throw new Error('UPLOAD_DIR is required')
	}

	return upload_dir
}

const resolveMatchedFiles = asset_patterns => {
	const matched_files = asset_patterns.flatMap(asset_pattern => {
		const asset_files = globSync(asset_pattern, { nodir: true }).sort((left, right) =>
			left.localeCompare(right)
		)

		if (asset_files.length === 0) {
			throw new Error(`No files matched pattern: ${asset_pattern}`)
		}

		return asset_files
	})

	return Array.from(new Set(matched_files))
}

const copyMatchedFiles = async ({ matched_files, upload_dir }) => {
	await rm(upload_dir, { force: true, recursive: true })
	await mkdir(upload_dir, { recursive: true })

	for (const asset_file of matched_files) {
		const target_path = `${upload_dir}/${basename(asset_file)}`

		await cp(asset_file, target_path, { force: true })
	}
}

const run = async () => {
	const asset_patterns = readAssetPatterns()
	const upload_dir = readUploadDir()
	const matched_files = resolveMatchedFiles(asset_patterns)

	await copyMatchedFiles({ matched_files, upload_dir })
}

await run()

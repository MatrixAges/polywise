import path from 'path'

export function getProjectRoot(): string {
	return process.cwd()
}

export function formatSize(bytes: number): string {
	if (bytes === 0) return '0 B'
	const k = 1024
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatSpeed(bytesPerSecond: number): string {
	return formatSize(bytesPerSecond) + '/s'
}

export function formatProgress(downloaded: number, total: number): string {
	const percent = total > 0 ? Math.round((downloaded / total) * 100) : 0
	const downloadedStr = formatSize(downloaded)
	const totalStr = formatSize(total)
	return `${downloadedStr} / ${totalStr} (${percent}%)`
}

export function resolveModelPath(modelsDir: string, modelId: string): string {
	return path.resolve(modelsDir, modelId)
}

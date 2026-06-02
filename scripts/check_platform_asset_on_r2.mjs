import { appendFile } from 'node:fs/promises'

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

const readReleaseBaseUrl = () => {
	const release_base_url = process.env.RELEASE_BASE_URL?.trim() || ''

	if (!release_base_url) {
		throw new Error('RELEASE_BASE_URL is required')
	}

	return release_base_url.replace(/\/+$/, '')
}

const readGithubOutputPath = () => {
	const github_output = process.env.GITHUB_OUTPUT?.trim() || ''

	if (!github_output) {
		throw new Error('GITHUB_OUTPUT is required')
	}

	return github_output
}

const writeOutput = async ({ key, value }) => {
	const github_output = readGithubOutputPath()

	await appendFile(github_output, `${key}=${value}\n`, 'utf8')
}

const resolveAssetUrl = () => {
	const asset_patterns = readAssetPatterns()
	const release_base_url = readReleaseBaseUrl()
	const first_asset_path = asset_patterns[0].replace(/^packages\/desktop\//, '')

	return `${release_base_url}/${first_asset_path}`
}

const requestAsset = async ({ asset_url, method }) => {
	const response = await fetch(asset_url, {
		method,
		redirect: 'follow'
	})

	return response
}

const resolveAssetStatus = async asset_url => {
	const head_response = await requestAsset({ asset_url, method: 'HEAD' })

	if (head_response.status !== 405) {
		return head_response
	}

	return requestAsset({ asset_url, method: 'GET' })
}

const run = async () => {
	const asset_url = resolveAssetUrl()
	const response = await resolveAssetStatus(asset_url)
	const already_published = response.ok ? 'true' : 'false'

	console.log(`Checked ${asset_url}: ${response.status}`)

	await writeOutput({ key: 'already_published', value: already_published })
}

await run()

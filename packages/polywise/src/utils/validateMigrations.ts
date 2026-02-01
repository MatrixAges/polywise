import type { Migration } from '../types'

export default (migrations: Migration[]) => {
	const versions = migrations.map(m => m.version)
	const unique_versions = new Set(versions)

	if (versions.length !== unique_versions.size) {
		throw new Error('Duplicate migration versions detected')
	}

	for (let i = 0; i < versions.length; i++) {
		if (versions[i] !== i + 1) {
			throw new Error(`Migration versions must be sequential. Expected ${i + 1}, got ${versions[i]}`)
		}
	}
}

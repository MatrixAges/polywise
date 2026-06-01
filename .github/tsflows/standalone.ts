#!/usr/bin/env bun
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createSerializer } from '@jlarky/gha-ts/render'
import { workflow } from '@jlarky/gha-ts/workflow-types'
import { YAML } from 'bun'

const release_branch_name = 'build'
const current_dir = dirname(fileURLToPath(import.meta.url))

const readPnpmVersion = () => {
	const package_json = JSON.parse(readFileSync(resolve(current_dir, '../../package.json'), 'utf8'))
	const package_manager = package_json?.packageManager

	if (typeof package_manager !== 'string') {
		throw new Error('packageManager is missing in root package.json')
	}

	const match = package_manager.match(/^pnpm@(.+)$/)

	if (!match?.[1]) {
		throw new Error(`Unsupported packageManager: ${package_manager}`)
	}

	return match[1]
}

const pnpm_version = readPnpmVersion()

const build_command = [
	'pnpm --filter "./packages/stk" run build',
	'pnpm --filter "./packages/erpc" run build',
	'pnpm --filter "./packages/app" run build:standalone',
	'pnpm --dir packages/polywise run build:standalone'
].join('\n')

const install_command = [
	"printf '\\ntrustLockfile: true\\n' >> pnpm-workspace.yaml",
	'pnpm install --frozen-lockfile'
].join('\n')

const workflow_definition = workflow({
	name: 'Release: Step 2 - Standalone',
	on: {
		workflow_call: {
			inputs: {
				release_version: {
					required: true,
					type: 'string',
					description: 'Resolved release version'
				},
				release_commit: {
					required: true,
					type: 'string',
					description: 'Release commit persisted to the repository'
				},
				release_tag: {
					required: true,
					type: 'string',
					description: 'Resolved release tag'
				}
			}
		}
	},
	concurrency: {
		group: 'publish-npm-${{ github.run_id }}',
		'cancel-in-progress': false
	},
	permissions: {
		contents: 'read',
		'id-token': 'write'
	},
	jobs: {
		publish: {
			'runs-on': 'ubuntu-latest',
			steps: [
				{
					uses: 'actions/checkout@v6',
					with: {
						'fetch-depth': 0,
						ref: release_branch_name
					}
				},
				{
					name: 'Pin build branch to release commit',
					shell: 'bash',
					run: 'git checkout --detach "${{ inputs.release_commit }}"'
				},
				{
					name: 'Setup pnpm',
					uses: 'pnpm/action-setup@v6',
					with: {
						version: pnpm_version,
						run_install: false
					}
				},
				{
					uses: 'actions/setup-node@v6',
					with: {
						'node-version': 'lts/*',
						cache: 'pnpm',
						'cache-dependency-path': 'pnpm-lock.yaml',
						'registry-url': 'https://registry.npmjs.org'
					}
				},
				{
					name: 'Setup Bun',
					uses: 'oven-sh/setup-bun@v2'
				},
				{
					name: 'Install dependencies',
					shell: 'bash',
					run: install_command
				},
				{
					name: 'Upgrade npm',
					run: 'npm install -g npm@latest'
				},
				{
					name: 'Build standalone package',
					shell: 'bash',
					run: build_command
				},
				{
					name: 'Publish polywise',
					shell: 'bash',
					'working-directory': 'packages/polywise',
					env: {
						RELEASE_VERSION: '${{ inputs.release_version }}'
					},
					run: [
						'published_version=$(npm view "polywise@${RELEASE_VERSION}" version 2>/dev/null || true)',
						'if [ "$published_version" = "$RELEASE_VERSION" ]; then',
						'	echo "polywise@${RELEASE_VERSION} already published, skipping npm publish."',
						'	exit 0',
						'fi',
						'npm publish --access public --provenance --no-git-checks'
					].join('\n')
				}
			]
		}
	}
})

const output_path = resolve(current_dir, '../workflows/standalone.generated.yml')

createSerializer(workflow_definition, YAML.stringify).writeWorkflow(output_path)

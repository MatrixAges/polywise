#!/usr/bin/env bun
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { checkout, setupNode } from '@jlarky/gha-ts/actions'
import { createSerializer } from '@jlarky/gha-ts/render'
import { workflow } from '@jlarky/gha-ts/workflow-types'
import { YAML } from 'bun'

const release_branch_name = 'build'

const build_command = [
	'pnpm --filter "./packages/stk" run build',
	'pnpm --filter "./packages/erpc" run build',
	'pnpm --filter "./packages/app" run build:standalone',
	'pnpm --dir packages/polywise run build:standalone'
].join('\n')

const workflow_definition = workflow({
	name: 'Publish NPM Package',
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
				checkout({
					'fetch-depth': 0,
					ref: release_branch_name
				}),
				{
					name: 'Pin build branch to release commit',
					shell: 'bash',
					run: 'git checkout --detach "${{ inputs.release_commit }}"'
				},
				setupNode({
					'node-version': 'lts/*',
					cache: 'pnpm',
					'cache-dependency-path': 'pnpm-lock.yaml',
					'registry-url': 'https://npmjs.org'
				}),
				{
					name: 'Setup pnpm',
					uses: 'pnpm/action-setup@v4',
					with: {
						run_install: false
					}
				},
				{
					name: 'Setup Bun',
					uses: 'oven-sh/setup-bun@v2'
				},
				{
					name: 'Verify draft release exists',
					shell: 'bash',
					env: {
						GH_TOKEN: '${{ secrets.GITHUB_TOKEN }}'
					},
					run: 'gh release view "${{ inputs.release_tag }}" --json isDraft,name,tagName >/dev/null'
				},
				{
					name: 'Install dependencies',
					run: 'pnpm install --frozen-lockfile'
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
					run: 'npm publish --access public --provenance --no-git-checks'
				}
			]
		}
	}
})

const current_dir = dirname(fileURLToPath(import.meta.url))
const output_path = resolve(current_dir, '../workflows/standalone.generated.yml')

createSerializer(workflow_definition, YAML.stringify).writeWorkflow(output_path)
